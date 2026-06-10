import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InteractiveGridPattern } from './interactive-grid';

describe('InteractiveGridPattern', () => {
  it('renders SVG element', () => {
    const { container } = render(<InteractiveGridPattern />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with custom dimensions', () => {
    const { container } = render(<InteractiveGridPattern width={20} height={30} squares={[2, 2]} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '40');
    expect(svg).toHaveAttribute('height', '60');
  });

  it('renders correct number of rects', () => {
    const { container } = render(<InteractiveGridPattern squares={[3, 2]} />);
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(6);
  });

  it('applies className to SVG', () => {
    const { container } = render(<InteractiveGridPattern className='custom-class' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('applies squaresClassName to each rect', () => {
    const { container } = render(
      <InteractiveGridPattern squares={[2, 1]} squaresClassName='square-style' />
    );
    const rects = container.querySelectorAll('rect');
    rects.forEach((rect) => {
      expect(rect).toHaveClass('square-style');
    });
  });

  it('changes fill on hover', () => {
    const { container } = render(<InteractiveGridPattern squares={[2, 1]} />);
    const rects = container.querySelectorAll('rect');

    expect(rects[0]).toHaveClass('fill-transparent');

    fireEvent.mouseEnter(rects[0]);
    expect(rects[0]).toHaveClass('fill-gray-300/30');

    fireEvent.mouseLeave(rects[0]);
    expect(rects[0]).toHaveClass('fill-transparent');
  });

  it('passes additional SVG props', () => {
    const { container } = render(<InteractiveGridPattern data-testid='grid-svg' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-testid', 'grid-svg');
  });
});
