"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { ShaderMaterial } from "three";

const heatVert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const heatFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uTint;

  // 2D FBM noise (Ashima-derived simplex)
  vec3 mod289(vec3 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec2 mod289(vec2 x){return x - floor(x * (1.0/289.0)) * 289.0;}
  vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
  float snoise(vec2 v){
    const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
    vec4 x12=x0.xyxy+C.xxzz;
    x12.xy-=i1;
    i=mod289(i);
    vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
    vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
    m=m*m;m=m*m;
    vec3 x=2.0*fract(p*C.www)-1.0;
    vec3 h=abs(x)-0.5;
    vec3 ox=floor(x+0.5);
    vec3 a0=x-ox;
    m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.0*dot(m,g);
  }
  float fbm(vec2 p){
    float v=0.0;
    float a=0.5;
    for(int i=0;i<4;i++){v+=a*snoise(p);p*=2.0;a*=0.5;}
    return v;
  }

  void main(){
    // Center distance from vertical strip — softer at edges
    float horizFalloff = 1.0 - abs(vUv.x - 0.5) * 2.0;
    horizFalloff = smoothstep(0.0, 0.6, horizFalloff);

    // Vertical envelope: full at base, fades by top
    float verticalFalloff = 1.0 - vUv.y;
    verticalFalloff = smoothstep(0.0, 1.0, verticalFalloff);

    // Scrolling FBM along Y produces the wavy heat shimmer
    vec2 nuv = vec2(vUv.x * 4.0, vUv.y * 3.0 - uTime * 0.9);
    float n = fbm(nuv);
    n = n * 0.5 + 0.5;

    // Translucent warm tint where shimmer is bright
    float alpha = horizFalloff * verticalFalloff * uIntensity * smoothstep(0.45, 0.95, n) * 0.35;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(uTint * (0.6 + n * 0.4), alpha);
  }
`;

interface HeatHazeProps {
  active: boolean;
  position?: [number, number, number];
  width?: number;
  height?: number;
}

/**
 * A translucent vertical billboard that simulates the wavy "heat shimmer"
 * effect rising from a hot flame.
 *
 * Implementation: shader-driven FBM-noise alpha pattern with a soft
 * vertical falloff. Faded smoothly via uIntensity when `active` toggles.
 *
 * NOTE: This is *not* a real refraction (no FBO sampling) — sampling the
 * scene FBO would require a custom render pipeline that isn't worth the
 * complexity for a small lab scene. The shader-only approach gives the
 * visual cue of heat without the cost.
 */
export function HeatHaze({
  active,
  position = [0, 0.4, 0],
  width = 0.18,
  height = 0.35,
}: HeatHazeProps) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensityRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uTint: { value: [1.0, 0.9, 0.7] },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const target = active ? 1 : 0;
    const speed = 1 / 0.6;
    intensityRef.current += (target - intensityRef.current) * Math.min(1, delta * speed);
    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uIntensity.value = intensityRef.current;
  });

  return (
    <mesh position={position} renderOrder={9} frustumCulled={false}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={heatVert}
        fragmentShader={heatFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
