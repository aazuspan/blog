import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useColorModeValue, useTheme, VStack } from "@chakra-ui/react";

function GlobeMesh() {
  const theme = useTheme();
  const mesh = useRef(null);
  const { mouse } = useThree();

  const accent = useColorModeValue(
    theme.colors.brand.light,
    theme.colors.brand.dark
  );

  useFrame((state, delta) => {
    mesh.current.rotation.y += (mouse.x / window.innerWidth) * 1.5;
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
  const background = useColorModeValue("white", "black");

  return (
    <VStack zIndex="hide" width="100%">
      <Canvas title="Globe">
        <fog attach="fog" args={[background, 3.5, 5.5]} />
        <directionalLight color="#fff" intensity={1} />
        <GlobeMesh />
      </Canvas>
    </VStack>
  );
}
