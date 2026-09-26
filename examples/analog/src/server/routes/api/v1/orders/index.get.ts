import { defineEventHandler } from 'h3';
import { ORDERS } from '../../../../data/catalog';

export default defineEventHandler(() => ORDERS);
