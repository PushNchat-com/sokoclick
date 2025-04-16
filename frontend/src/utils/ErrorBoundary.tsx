import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Heading, Text, Button, Container, VStack } from '@chakra-ui/react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Pick<ErrorBoundaryState, 'hasError'> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <Container maxW="container.lg" py={10}>
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl" color="red.500">
              Something went wrong
            </Heading>
            <Text fontSize="lg">
              We're sorry, but an error occurred while rendering this page.
            </Text>
            
            {process.env.NODE_ENV !== 'production' && error && (
              <Box
                p={4}
                bg="gray.100"
                borderRadius="md"
                whiteSpace="pre-wrap"
                overflowX="auto"
                fontSize="sm"
                fontFamily="monospace"
              >
                {error.toString()}
              </Box>
            )}
            
            <Button
              colorScheme="blue"
              onClick={this.handleReset}
              alignSelf="flex-start"
            >
              Try Again
            </Button>
          </VStack>
        </Container>
      );
    }

    return children;
  }
}

export default ErrorBoundary; 