import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as colors from '../styles/colors.module.scss';
import { useContext } from "react";
import { ThemeContext } from "./theme";

function GlobeMesh() {
  const { theme } = useContext(ThemeContext);
  const mesh = useRef(null);
  const { mouse } = useThree();

  const accent = theme === "dark" ? colors.accentDark : colors.accentLight;

  useFrame((state, delta) => {
      mesh.current.rotation.y += (mouse.x / window.innerWidth) * 1.5;
    //   mesh.current.rotation.x += (mouse.y / window.innerHeight) * -1.5;
      mesh.current.rotation.x += delta * 0.05;
  });

  return (
    <mesh ref={mesh} position={[0, -8, -2]}>
      <icosahedronGeometry args={[9, 15]} />
      <meshLambertMaterial color={accent} wireframe={true} />
    </mesh>
  );
}

export default function Globe() {
  const { theme } = useContext(ThemeContext);
  const background = theme === "dark" ? colors.backgroundDark : colors.backgroundLight;

  return (
    <Canvas>
      <fog attach="fog" args={[background, 3.5, 5.5]} />
      <directionalLight color="#fff" intensity={1} />
      <GlobeMesh />
    </Canvas>
  );
}
