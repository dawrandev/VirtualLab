"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, ShaderMaterial, Color, Vector3 } from "three";

const fireVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fireFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uInnerColor;
  uniform vec3 uMidColor;
  uniform vec3 uOuterColor;

  // 2D simplex noise (Ashima Arts, public domain)
  vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
  vec2 mod289(vec2 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
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
    float amp=0.5;
    for(int i=0;i<5;i++){v+=amp*snoise(p);p*=2.0;amp*=0.5;}
    return v;
  }

  void main(){
    vec2 uv = vUv;
    // Center distance — flame is wider at base, narrows at top
    float widthAtY = mix(1.0, 0.25, uv.y);
    float dx = (uv.x - 0.5) / widthAtY;
    float radial = abs(dx) * 2.0;

    // Vertical scrolling FBM
    vec2 noiseUV = vec2(uv.x * 2.0, uv.y * 1.5 - uTime * 1.6);
    float n = fbm(noiseUV) * 0.5 + 0.5;

    // Flame shape
    float core = 1.0 - radial;
    float shape = core * smoothstep(1.0, 0.0, uv.y * 1.05);
    shape *= mix(0.85, 1.15, n);
    shape = clamp(shape, 0.0, 1.0);

    // Color gradient by height
    vec3 col = mix(uInnerColor, uMidColor, smoothstep(0.0, 0.45, uv.y));
    col = mix(col, uOuterColor, smoothstep(0.45, 1.0, uv.y));

    float alpha = pow(shape, 1.5) * uIntensity;
    if(alpha < 0.01) discard;
    gl_FragColor = vec4(col * (0.6 + n * 0.4), alpha);
  }
`;

interface FireShaderProps {
  active: boolean;
  position?: [number, number, number];
  height?: number;
  width?: number;
}

/**
 * Procedural flame: billboarded plane with scrolling FBM noise.
 * Two color zones: inner blue cone, mid yellow, outer orange.
 * Fades in/out over 0.4s when `active` toggles.
 */
export function FireShader({
  active,
  position = [0, 0.05, 0],
  height = 0.18,
  width = 0.08,
}: FireShaderProps) {
  const matRef = useRef<ShaderMaterial>(null);
  const intensityRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uInnerColor: { value: new Color("#3060ff") }, // hot blue
      uMidColor: { value: new Color("#ffd060") }, // yellow
      uOuterColor: { value: new Color("#ff6020") }, // orange
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const target = active ? 1 : 0;
    const speed = 1 / 0.4;
    intensityRef.current += (target - intensityRef.current) * Math.min(1, delta * speed);
    matRef.current.uniforms.uTime.value += delta;
    matRef.current.uniforms.uIntensity.value = intensityRef.current;
  });

  return (
    <mesh position={position} renderOrder={10} frustumCulled={false}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={fireVert}
        fragmentShader={fireFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

// Touch unused for now; reserved for VR later
void Vector3;
