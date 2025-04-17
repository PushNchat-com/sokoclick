import React from 'react';
import { ChakraProvider as ChakraUIProvider, extendTheme } from '@chakra-ui/react';
// Importing directly from the canonical implementation
import { ToastProvider } from '../components/ui/Toast';

interface Props {
  children: React.ReactNode;
}

// Create a theme instance
const theme = extendTheme({
  // Add your custom theme configuration here
});

const ChakraProvider: React.FC<Props> = ({ children }) => {
  return (
    <ChakraUIProvider theme={theme}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ChakraUIProvider>
  );
};

export default ChakraProvider; 