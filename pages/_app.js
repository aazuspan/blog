import "../styles/globals.css";

import Footer from "../components/footer";
import Header from "../components/header";
import { ChakraProvider, VStack, Flex } from "@chakra-ui/react";
import "@fontsource/outfit/800.css";
import "@fontsource/outfit/400.css";
import "@fontsource/quicksand";
import theme from "../utils/theme";
import { motion, AnimatePresence } from "framer-motion";

export default function App({ Component, pageProps, router }) {
  return (
    <ChakraProvider theme={theme}>
      <Flex
        direction="column"
        minH="100vh"
        maxW="38rem"
        marginX="auto"
        paddingX={3}
        // Hide overflow to prevent window rescaling on mobile, but allow 
        // it for desktop to prevent cutting off page transitions
        overflowX={["hidden", "visible"]}
      >
        <Header />
        <VStack pt={6} flex={1} align="stretch">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.route}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 100 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2, ease: "linear" }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </VStack>
        <Footer />
      </Flex>
    </ChakraProvider>
  );
}
