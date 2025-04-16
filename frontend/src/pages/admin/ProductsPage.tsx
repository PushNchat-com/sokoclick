import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  VStack,
  Input,
  FormControl,
  FormLabel,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Flex,
  Tooltip,
  Image,
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ViewIcon, 
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@chakra-ui/icons';
import { getProducts, getProductCategories, deleteProduct } from '../../services/products';
import type { Product } from '../../types/supabase';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui';
import ErrorBoundary from '../../utils/ErrorBoundary';

const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const filters: {
        search?: string;
        category?: string;
      } = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (categoryFilter) filters.category = categoryFilter;
      
      const { data, count } = await getProducts(limit, offset, filters, false);
      setProducts(data);
      setTotalCount(count);
      setPage(page);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getProductCategories(false);
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearch = () => {
    fetchProducts(1);
  };

  const handleCategoryFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setPage(1);
    fetchProducts(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    onOpen();
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProduct(selectedProduct.id);
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      toast.success('Product deleted successfully');
      onClose();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XAF',
    }).format(price);
  };

  return (
    <ErrorBoundary>
      <Box p={4}>
        <VStack spacing={4} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading size="lg">{t('Products Management')}</Heading>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="blue" 
              onClick={() => {
                /* Navigate to product creation page */
              }}
            >
              {t('Add New Product')}
            </Button>
          </Flex>

          <Card>
            <Box p={4}>
              <HStack spacing={4} mb={4}>
                <FormControl>
                  <FormLabel htmlFor="search">{t('Search Products')}</FormLabel>
                  <Flex>
                    <Input
                      id="search"
                      placeholder={t('Search by name...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <IconButton
                      aria-label="Search"
                      icon={<SearchIcon />}
                      ml={2}
                      onClick={handleSearch}
                    />
                  </Flex>
                </FormControl>

                <FormControl>
                  <FormLabel htmlFor="category">{t('Filter by Category')}</FormLabel>
                  <Select 
                    id="category" 
                    value={categoryFilter} 
                    onChange={handleCategoryFilter}
                  >
                    <option value="">{t('All Categories')}</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              {error && (
                <Alert status="error" mb={4}>
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              {loading ? (
                <Flex justify="center" p={8}>
                  <Spinner size="xl" />
                </Flex>
              ) : products.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  {t('No products found')}
                </Alert>
              ) : (
                <>
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>{t('Image')}</Th>
                          <Th>{t('Name')}</Th>
                          <Th>{t('Price')}</Th>
                          <Th>{t('Category')}</Th>
                          <Th>{t('Status')}</Th>
                          <Th isNumeric>{t('Actions')}</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {products.map((product) => (
                          <Tr key={product.id}>
                            <Td>
                              {product.image_urls && product.image_urls.length > 0 ? (
                                <Image 
                                  src={product.image_urls[0]} 
                                  alt={product.name_en}
                                  boxSize="50px"
                                  objectFit="cover"
                                  borderRadius="md"
                                  fallbackSrc="https://via.placeholder.com/50"
                                />
                              ) : (
                                <Box 
                                  bg="gray.200" 
                                  boxSize="50px" 
                                  borderRadius="md" 
                                  display="flex" 
                                  alignItems="center" 
                                  justifyContent="center"
                                >
                                  <Text fontSize="xs" color="gray.500">No image</Text>
                                </Box>
                              )}
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="bold">{product.name_en}</Text>
                                <Text fontSize="sm" color="gray.500">{product.name_fr}</Text>
                              </VStack>
                            </Td>
                            <Td>{formatPrice(product.starting_price, product.currency)}</Td>
                            <Td>
                              {product.category ? (
                                <Badge colorScheme="blue">{product.category}</Badge>
                              ) : (
                                <Text color="gray.500">-</Text>
                              )}
                            </Td>
                            <Td>
                              <Badge colorScheme="green">Active</Badge>
                            </Td>
                            <Td isNumeric>
                              <HStack spacing={2} justify="flex-end">
                                <Tooltip label={t('View Product')}>
                                  <IconButton
                                    aria-label={t('View Product')}
                                    icon={<ViewIcon />}
                                    size="sm"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => {
                                      /* Navigate to product detail */
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label={t('Edit Product')}>
                                  <IconButton
                                    aria-label={t('Edit Product')}
                                    icon={<EditIcon />}
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => {
                                      /* Navigate to product edit */
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip label={t('Delete Product')}>
                                  <IconButton
                                    aria-label={t('Delete Product')}
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => handleDeleteClick(product)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>

                  {/* Pagination */}
                  <Flex justify="space-between" align="center" mt={4}>
                    <Text>
                      {t('Showing')} {products.length} {t('of')} {totalCount} {t('products')}
                    </Text>
                    <HStack>
                      <Button
                        leftIcon={<ChevronLeftIcon />}
                        onClick={() => handlePageChange(page - 1)}
                        isDisabled={page === 1}
                        size="sm"
                      >
                        {t('Previous')}
                      </Button>
                      <Text>
                        {t('Page')} {page} {t('of')} {totalPages}
                      </Text>
                      <Button
                        rightIcon={<ChevronRightIcon />}
                        onClick={() => handlePageChange(page + 1)}
                        isDisabled={page === totalPages}
                        size="sm"
                      >
                        {t('Next')}
                      </Button>
                    </HStack>
                  </Flex>
                </>
              )}
            </Box>
          </Card>
        </VStack>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t('Confirm Delete')}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              {t('Are you sure you want to delete this product?')}
              {selectedProduct && (
                <Text fontWeight="bold" mt={2}>
                  {selectedProduct.name_en}
                </Text>
              )}
            </Text>
            <Text mt={2} color="red.500">
              {t('This action cannot be undone.')}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              {t('Delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ErrorBoundary>
  );
};

export default ProductsPage; 