import { Service, computed, signal } from '@angular/core';
import type { Product } from '../../server/data/catalog';

export interface CartLine {
  product: Product;
  quantity: number;
}

@Service()
export class CartStore {
  private readonly lines = signal<CartLine[]>([]);

  readonly items = this.lines.asReadonly();
  readonly count = computed(() => this.lines().reduce((sum, line) => sum + line.quantity, 0));
  readonly total = computed(() =>
    this.lines().reduce((sum, line) => sum + line.product.price * line.quantity, 0),
  );
  readonly isEmpty = computed(() => this.lines().length === 0);

  add(product: Product) {
    this.lines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      return existing
        ? lines.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line))
        : [...lines, { product, quantity: 1 }];
    });
  }

  remove(productId: number) {
    this.lines.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  clear() {
    this.lines.set([]);
  }
}
