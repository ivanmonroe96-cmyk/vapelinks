// Merged product data - combines main products with disposable vapes
import productsData from '../data/products.json';
import disposableVapes from '../data/disposable-vapes.json';

export const allProducts = [...productsData, ...disposableVapes];
