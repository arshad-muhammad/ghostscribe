import React from 'react';
import { BarChart3, Eye, FileText, Languages, Shield, Wand2 } from 'lucide-react';
import type { FeatureType } from '../types';

export const features: FeatureType[] = [
  {
    title: 'Human-like Rewriting',
    description: 'Advanced AI algorithms that transform your content while maintaining natural human writing patterns.',
    icon: Wand2,
    available: true
  },
  {
    title: 'AI Detector Bypass',
    description: 'Ensure your content passes through AI detection tools unnoticed.',
    icon: Shield,
    available: true
  },
  {
    title: 'SEO Safe Content',
    description: 'Maintain search engine optimization while humanizing your content.',
    icon: FileText,
    available: true
  },
  {
    title: 'Multi-language Support',
    description: 'Support for multiple languages to serve a global audience.',
    icon: Languages,
    available: true
  },
  {
    title: 'Advanced Analytics',
    description: 'Track your content performance and AI detection scores.',
    icon: BarChart3,
    available: true
  },
  {
    title: 'Three Powerful Models',
    description: 'Choose from different AI models optimized for various use cases.',
    icon: Eye,
    available: true
  }
];