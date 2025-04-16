import React from 'react';
import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';

interface Props {
  children: React.ReactNode;
}

const ChakraProvider: React.FC<Props> = ({ children }) => {
  return <ChakraUIProvider>{children}</ChakraUIProvider>;
};

export default ChakraProvider; 