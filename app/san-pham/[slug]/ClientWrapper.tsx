"use client";

import { useRouter } from 'next/navigation';
import { getRouteUrl } from '../../../src/lib/utils';
import ProductDetail from '../../../src/components/ProductDetail';
import type { Product, RouteState } from '../../../src/types';

interface ClientWrapperProps {
  slug: string;
  initialProduct: Product;
}

export default function ClientWrapper({ slug, initialProduct }: ClientWrapperProps) {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  const handleShowNotification = () => {};

  return (
    <ProductDetail 
      slug={slug}
      productId=""
      onNavigate={handleNavigate}
      onShowNotification={handleShowNotification}
      initialProduct={initialProduct}
    />
  );
}
