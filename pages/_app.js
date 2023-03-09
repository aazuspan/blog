import "../styles/globals.scss";

import Footer from "../components/footer";
import Header from "../components/header";
import { ChakraProvider, VStack, Flex } from "@chakra-ui/react";
import "@fontsource/outfit/800.css";
import "@fontsource/outfit/400.css";
import "@fontsource/quicksand";
import theme from "../utils/theme";


export default function App({ Component, pageProps }) {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        direction="column"
        minH="100vh"
        maxW="36rem"
        marginX="auto"
      >
        <Header />
        <VStack pt={6} flex={1} align="stretch">
          <Component {...pageProps} />
        </VStack>
        <Footer />
      </Flex>
    </ChakraProvider>
  );
}