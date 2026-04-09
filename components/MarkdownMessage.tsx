/**
 * OpenLiL AI — Markdown Message
 * Renders AI markdown output with theme-appropriate styling
 * Supports: Math Symbols, LaTeX patterns, Tables, Code, and Academic formatting
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from './ThemeContext';
import { FontFamily } from '../constants/fonts';

interface MarkdownMessageProps {
  content: string;
}

/**
 * Smart Preprocessor
 * Converts common LaTeX math patterns into high-fidelity Unicode symbols
 * to ensure "all symbols" are rendered natively without heavy dependencies.
 */
function preprocessMath(text: string): string {
  if (!text) return '';
  
  return text
    // Replace LaTeX symbols with Unicode equivalents
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\epsilon/g, 'ε')
    .replace(/\\zeta/g, 'ζ')
    .replace(/\\eta/g, 'η')
    .replace(/\\theta/g, 'θ')
    .replace(/\\iota/g, 'ι')
    .replace(/\\kappa/g, 'κ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\nu/g, 'ν')
    .replace(/\\xi/g, 'ξ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\tau/g, 'τ')
    .replace(/\\upsilon/g, 'υ')
    .replace(/\\phi/g, 'φ')
    .replace(/\\chi/g, 'χ')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\omega/g, 'ω')
    
    // Math Operators
    .replace(/\\sum/g, '∑')
    .replace(/\\int/g, '∫')
    .replace(/\\sqrt/g, '√')
    .replace(/\\infty/g, '∞')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\le/g, '≤')
    .replace(/\\ge/g, '≥')
    .replace(/\\pm/g, '±')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\nabla/g, '∇')
    .replace(/\\partial/g, '∂')
    .replace(/\\forall/g, '∀')
    .replace(/\\exists/g, '∃')
    .replace(/\\in/g, '∈')
    .replace(/\\notin/g, '∉')
    
    // Subscripts/Superscripts (Common ones)
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^n/g, 'ⁿ')
    .replace(/\_i/g, 'ᵢ')
    .replace(/\_j/g, 'ⱼ')
    .replace(/\_n/g, 'ₙ')
    
    // Clean up math delimiters for better readability
    .replace(/\$\$([\s\S]*?)\$\$/g, '\n\n$1\n\n')
    .replace(/\$([\s\S]*?)\$/g, '$1');
}

export default function MarkdownMessage({ content }: MarkdownMessageProps) {
  const { colors } = useTheme();

  // Process content once to ensure smooth rendering
  const processedContent = useMemo(() => preprocessMath(content), [content]);

  const mdStyles = StyleSheet.create({
    body: {
      color: colors.textPrimary,
      fontSize: 15,
      lineHeight: 22,
      fontFamily: FontFamily.primary,
    },
    heading1: {
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: '700',
      marginTop: 20,
      marginBottom: 10,
      fontFamily: FontFamily.primary,
    },
    heading2: {
      color: colors.textPrimary,
      fontSize: 19,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
      fontFamily: FontFamily.primary,
    },
    heading3: {
      color: colors.textPrimary,
      fontSize: 17,
      fontWeight: '600',
      marginTop: 12,
      marginBottom: 6,
      fontFamily: FontFamily.primary,
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 10,
    },
    code_inline: {
      backgroundColor: colors.surfaceElevated,
      color: colors.textPrimary,
      fontFamily: FontFamily.mono,
      fontSize: 13,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fence: {
      backgroundColor: colors.surfaceElevated,
      color: colors.textPrimary,
      fontFamily: FontFamily.mono,
      fontSize: 13,
      padding: 14,
      borderRadius: 12,
      marginVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    code_block: {
      backgroundColor: colors.surfaceElevated,
      color: colors.textPrimary,
      fontFamily: FontFamily.mono,
      fontSize: 13,
      padding: 14,
      borderRadius: 12,
    },
    blockquote: {
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.textSecondary,
      paddingLeft: 14,
      paddingVertical: 4,
      marginVertical: 10,
      borderRadius: 4,
    },
    list_item: {
      color: colors.textPrimary,
      marginBottom: 6,
    },
    bullet_list: {
      marginVertical: 6,
    },
    ordered_list: {
      marginVertical: 6,
    },
    strong: {
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
    },
    link: {
      color: colors.textPrimary,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 16,
    },
    table: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 10,
      overflow: 'hidden',
      marginVertical: 10,
    },
    thead: {
      backgroundColor: colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    th: {
      color: colors.textPrimary,
      fontWeight: '700',
      padding: 10,
      fontSize: 13,
    },
    td: {
      color: colors.textPrimary,
      padding: 10,
      fontSize: 13,
    },
    tr: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
    },
    image: {
      borderRadius: 12,
      marginVertical: 10,
    },
  });

  return (
    <View style={{ flex: 1, overflow: 'hidden' }}>
      <Markdown style={mdStyles}>
        {processedContent || ' '}
      </Markdown>
    </View>
  );
}
