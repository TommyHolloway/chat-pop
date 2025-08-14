import React from 'react';
import { Palette } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const predefinedColors = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Palette className="w-4 h-4" />
        {label}
      </Label>
      
      <div className="flex flex-wrap gap-2">
        {predefinedColors.map((color) => (
          <button
            key={color}
            type="button"
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === color 
                ? 'border-primary scale-110' 
                : 'border-muted-foreground/20 hover:border-muted-foreground/40'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            disabled={disabled}
          />
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-8 h-8 rounded border border-input cursor-pointer disabled:cursor-not-allowed"
        />
        <span className="text-sm text-muted-foreground">Custom color</span>
      </div>
    </div>
  );
};