import React from 'react';
import { FeatureType } from '../types';
import { Wand2, Shield, FileText, Languages, BarChart3, Eye } from 'lucide-react';

export const features: FeatureType[] = [
  {
    title: 'Human-like Rewriting',
    description: 'Our advanced AI transforms content into natural, human-like text that retains your original meaning while eliminating AI patterns.',
    icon: Wand2
  },
  {
    title: 'AI Detector Bypass',
    description: 'Content processed through GhostScribe consistently passes major AI detection tools including GPTZero, Turnitin, and Originality.ai.',
    icon: Shield
  },
  {
    title: 'SEO Safe Content',
    description: 'All transformed content maintains proper keyword density and semantic relevance for optimal search engine performance.',
    icon: FileText
  },
  {
    title: 'Multi-language Support',
    description: 'Humanize content in multiple languages including English, Spanish, French, German, and Hindi with natural, native-sounding results.',
    icon: Languages
  },
  {
    title: 'Advanced Analytics',
    description: 'Track your usage, monitor word counts, and analyze AI detection scores to optimize your content strategy.',
    icon: BarChart3
  },
  {
    title: 'Three Powerful Models',
    description: 'Choose from Ninja (standard rewriting), Ghost (maximum undetectability), or Generator (AI-generated new content) based on your needs.',
    icon: Eye
  }
];