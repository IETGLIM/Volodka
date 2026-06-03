/* ─── Volodka RPG – Shared Item Icon Renderer ───
 * Consolidated from: Inventory.tsx, TradingPanel.tsx, CraftingPanel.tsx, QuickUseBar.tsx
 * This is the single source of truth for mapping icon name strings to Lucide icons.
 */

import {
  Coffee,
  Zap,
  Syringe,
  Wine,
  Leaf,
  CircuitBoard,
  FileText,
  Award,
  Key,
  ScrollText,
  Usb,
  Smartphone,
  Laptop,
  BookOpen,
  Cpu,
  Braces,
  Shield,
  Feather,
  File,
  Flower2,
  ShieldCheck,
  Terminal,
  Flame,
  Shirt,
  Gem,
  Heart,
  Bug,
  Brain,
  Stethoscope,
  Unlock,
  Wifi,
  Radio,
  HardDrive,
  Headphones,
  Cable,
  Ghost,
  Bandage,
  Hexagon,
  Sparkles,
  Package,
  Utensils,
  Lock,
} from 'lucide-react';

export interface ItemIconProps {
  icon?: string;
  className?: string;
}

/**
 * Renders the appropriate Lucide icon for a given item icon name string.
 * Used across Inventory, Trading, Crafting, and QuickUse panels.
 *
 * Default case: returns a Package icon (ensures every item always has a visible icon).
 */
export function ItemIcon({ icon: iconName, className }: ItemIconProps) {
  switch (iconName) {
    /* ── Consumables ── */
    case 'Coffee':      return <Coffee className={className} />;
    case 'Cigarette':   return <Flame className={className} />;
    case 'Zap':         return <Zap className={className} />;
    case 'Pill':        return <Syringe className={className} />;
    case 'Wine':        return <Wine className={className} />;
    case 'Leaf':        return <Leaf className={className} />;
    case 'Syringe':     return <Syringe className={className} />;
    case 'Candy':       return <Flower2 className={className} />;
    case 'Utensils':    return <Utensils className={className} />;
    case 'Bandage':     return <Bandage className={className} />;

    /* ── Tech / Hardware ── */
    case 'Chip':        return <CircuitBoard className={className} />;
    case 'Cpu':         return <Cpu className={className} />;
    case 'HardDrive':   return <HardDrive className={className} />;
    case 'Usb':         return <Usb className={className} />;
    case 'Smartphone':  return <Smartphone className={className} />;
    case 'Laptop':      return <Laptop className={className} />;
    case 'Terminal':    return <Terminal className={className} />;
    case 'Braces':      return <Braces className={className} />;
    case 'Cable':       return <Cable className={className} />;
    case 'Wifi':        return <Wifi className={className} />;
    case 'Radio':       return <Radio className={className} />;
    case 'Headphones':  return <Headphones className={className} />;

    /* ── Documents / Knowledge ── */
    case 'FileText':    return <FileText className={className} />;
    case 'File':        return <File className={className} />;
    case 'BookOpen':    return <BookOpen className={className} />;
    case 'ScrollText':  return <ScrollText className={className} />;
    case 'Feather':     return <Feather className={className} />;

    /* ── Equipment / Armor ── */
    case 'Shield':      return <Shield className={className} />;
    case 'ShieldCheck': return <ShieldCheck className={className} />;
    case 'Shirt':       return <Shirt className={className} />;
    case 'Lock':        return <Lock className={className} />;
    case 'Unlock':      return <Unlock className={className} />;

    /* ── Awards / Gems / Status ── */
    case 'Badge':       return <Award className={className} />;
    case 'Award':       return <Award className={className} />;
    case 'Gem':         return <Gem className={className} />;
    case 'Heart':       return <Heart className={className} />;
    case 'Key':         return <Key className={className} />;
    case 'Sparkles':    return <Sparkles className={className} />;
    case 'Flower2':     return <Flower2 className={className} />;

    /* ── Creatures / Mystery ── */
    case 'Bug':         return <Bug className={className} />;
    case 'Brain':       return <Brain className={className} />;
    case 'Stethoscope': return <Stethoscope className={className} />;
    case 'Ghost':       return <Ghost className={className} />;
    case 'Hexagon':     return <Hexagon className={className} />;

    /* ── Flame (explicit, separate from Cigarette alias) ── */
    case 'Flame':       return <Flame className={className} />;

    /* ── Package ── */
    case 'Package':     return <Package className={className} />;

    /* ── Default: always show Package instead of null ── */
    default:            return <Package className={className} />;
  }
}
