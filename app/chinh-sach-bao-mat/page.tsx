"use client";

import React from 'react';
import { getRouteUrl } from '../../src/lib/utils';
import type { RouteState } from '../../src/types';

import { useRouter } from 'next/navigation';
import PrivacyPolicy from '../../src/components/PrivacyPolicy';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  const handleNavigate = (route: RouteState) => {
    router.push(getRouteUrl(route));
  };

  return (
    <PrivacyPolicy onNavigate={handleNavigate} />
  );
}
