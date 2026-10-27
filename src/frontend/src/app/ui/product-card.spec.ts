import { TestBed } from '@angular/core/testing';
import type { Product } from '@buffetya/shared';
import { ProductCard } from './product-card';

const empanada: Product = {
  id: 'empanada-carne',
  name: 'Empanada de carne',
  priceCents: 140_000,
  category: 'mains',
  dietaryTags: [],
  imageUrl: '/products/empanada-carne.jpg',
  available: true,
  prepMinutes: 5,
};

async function render(product: Product, quantity: number) {
  const fixture = TestBed.createComponent(ProductCard);
  fixture.componentRef.setInput('product', product);
  fixture.componentRef.setInput('quantity', quantity);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const button = (label: string) =>
    element.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  return { fixture, element, button };
}

describe('ProductCard', () => {
  it('shows name and price, and a single "+" while the product is not in the cart', async () => {
    const { element, button } = await render(empanada, 0);
    expect(element.textContent).toContain('Empanada de carne');
    expect(element.textContent).toContain('$1.400');
    expect(button('Agregar Empanada de carne')).not.toBeNull();
    expect(element.querySelector('output')).toBeNull();
  });

  it('emits add when "+" is pressed', async () => {
    const { fixture, button } = await render(empanada, 0);
    const added = vi.fn();
    fixture.componentInstance.add.subscribe(added);
    button('Agregar Empanada de carne')?.click();
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('turns into "− N +" once the product is in the cart', async () => {
    const { fixture, element, button } = await render(empanada, 2);
    const increments = vi.fn();
    const decrements = vi.fn();
    fixture.componentInstance.increment.subscribe(increments);
    fixture.componentInstance.decrement.subscribe(decrements);

    expect(element.querySelector('output')?.textContent?.trim()).toBe('2');
    button('Agregar uno de Empanada de carne')?.click();
    button('Quitar uno de Empanada de carne')?.click();

    expect(increments).toHaveBeenCalledTimes(1);
    expect(decrements).toHaveBeenCalledTimes(1);
  });

  it('shows dietary tags in words', async () => {
    const { element } = await render({ ...empanada, dietaryTags: ['gluten_free', 'vegan'] }, 0);
    expect(element.textContent).toContain('SIN TACC');
    expect(element.textContent).toContain('VEGANO');
  });

  it('keeps an out-of-stock product visible, labeled, and without any add control', async () => {
    const { element } = await render({ ...empanada, available: false }, 0);
    expect(element.textContent).toContain('Empanada de carne');
    expect(element.textContent).toContain('SIN STOCK');
    expect(element.textContent).toContain('$1.400');
    expect(element.querySelectorAll('button')).toHaveLength(0);
    expect(element.querySelector('.product--out img')).not.toBeNull();
  });

  it('shows the product photo lazily, sized up front, named by the product', async () => {
    const { element } = await render(empanada, 0);
    const img = element.querySelector('img');
    expect(img?.getAttribute('src')).toBe('/products/empanada-carne.jpg');
    expect(img?.getAttribute('alt')).toBe('Empanada de carne');
    expect(img?.getAttribute('loading')).toBe('lazy');
    expect(img?.getAttribute('decoding')).toBe('async');
    expect(img?.getAttribute('width')).toBe('640');
    expect(img?.getAttribute('height')).toBe('480');
  });

  it('falls back to a neutral box when the photo cannot load, with no placeholder wording', async () => {
    const { fixture, element } = await render(empanada, 0);
    element.querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.photo')).not.toBeNull();
    expect(element.textContent).not.toMatch(/demo|foto/i);
  });
});
