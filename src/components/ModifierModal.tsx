import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, ModifierGroup, ModifierOption, Category } from '../types';
import { DEFAULT_MODIFIER_GROUPS, getModifierGroupIdsForItem } from '../constants';
import { calculateChipsPrice, getModifierPriority, adjustModifierPrices } from '../utils/modifierUtils';
import { X } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, modifiers: ModifierOption[], quantity: number, instructions?: string, manualPrice?: number) => void;
  initialSelections?: ModifierOption[];
  initialQuantity?: number;
  initialInstructions?: string;
  initialCustomPrice?: number;
  isEditing?: boolean;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, isOpen, onClose, onAddToCart, initialSelections = [], initialQuantity = 1, initialInstructions = '', initialCustomPrice, isEditing = false }) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierOption[]>>({});
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState('');
  const [customPrice, setCustomPrice] = useState<string>('');

  useEffect(() => {
    if (isOpen && item) {
      const initial: Record<string, ModifierOption[]> = {};
      
      if (initialSelections.length > 0) {
        initialSelections.forEach(sel => {
          if (sel.groupId) {
            if (!initial[sel.groupId]) initial[sel.groupId] = [];
            initial[sel.groupId].push(sel);
          }
        });
      } else {
        // Populate defaults if no initial selections
        const baseGroupIds = getModifierGroupIdsForItem(item);
        baseGroupIds.forEach(groupId => {
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          if (group && !group.allowMultiple && group.options.length > 0) {
            if (group.options[0].price === 0) {
              initial[group.id] = [{ ...group.options[0], groupId: group.id, groupName: group.name }];
            }
          }
        });
      }
      
      const initialQuantities: Record<string, number> = {};
      if ((item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot') && !isEditing) {
        // Start with no drinks/sauces selected so the user can pick themselves
      }
      
      setSelectedModifiers(initial);
      setOptionQuantities(initialQuantities);
      setQuantity(initialQuantity);
      setInstructions(initialInstructions);
      setCustomPrice(initialCustomPrice !== undefined ? initialCustomPrice.toString() : '');
    }
  }, [isOpen, item, initialSelections, initialQuantity, initialInstructions, initialCustomPrice, isEditing]);

  const visibleGroupIds = useMemo(() => {
    if (!item) return [];
    const baseGroupIds = getModifierGroupIdsForItem(item);
    
    // We use an array to maintain order, and a set to prevent duplicates
    const finalGroupIds = [...baseGroupIds];
    const processedGroupIds = new Set<string>();

    // We process groups in the order they appear in finalGroupIds
    // This allows us to insert triggered groups right after their parent
    let i = 0;
    while (i < finalGroupIds.length) {
      const groupId = finalGroupIds[i];
      if (!processedGroupIds.has(groupId)) {
        processedGroupIds.add(groupId);

        // Get selected options for this group
        const selected = selectedModifiers[groupId] || [];
        
        // Also check optionQuantities for triggers
        const qtySelected: ModifierOption[] = [];
        Object.entries(optionQuantities).forEach(([key, qty]) => {
          if (qty > 0) {
            const [gId, optionName] = key.split('||');
            if (gId === groupId) {
              const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
              const option = group?.options.find(o => o.name === optionName);
              if (group && option) {
                qtySelected.push({ ...option, groupId: group.id, groupName: group.name });
              }
            }
          }
        });
        
        const allSelectedForGroup = [...selected, ...qtySelected];

        if (allSelectedForGroup.length > 0) {
          // Collect all triggered groups
          const triggeredIds: string[] = [];
          allSelectedForGroup.forEach(opt => {
             if (opt.triggersGroupId && !finalGroupIds.includes(opt.triggersGroupId) && !triggeredIds.includes(opt.triggersGroupId)) {
               triggeredIds.push(opt.triggersGroupId);
             }
             if (opt.triggersGroupIds) {
               opt.triggersGroupIds.forEach(id => {
                 if (!finalGroupIds.includes(id) && !triggeredIds.includes(id)) {
                   triggeredIds.push(id);
                 }
               });
             }
          });
          
          // Insert triggered groups right after the current group
          if (triggeredIds.length > 0) {
            finalGroupIds.splice(i + 1, 0, ...triggeredIds);
          }
        }
      }
      i++;
    }
    
    // Filter out side_add_chips if size implies chips
    let filteredGroupIds = finalGroupIds;
    const sizeFishSelection = selectedModifiers['size_fish']?.[0]?.name;
    const codBitesSizeSelection = selectedModifiers['cod_bites_size']?.[0]?.name;
    
    if (
      (sizeFishSelection && sizeFishSelection.includes('& Chips Box')) ||
      (codBitesSizeSelection && codBitesSizeSelection.includes('& Chips Box'))
    ) {
      filteredGroupIds = filteredGroupIds.filter(id => id !== 'side_add_chips');
    }
    
    // Sort the final groups by priority only for Kebabs, Wraps, and Burgers
    if (item.category === Category.KEBABS || item.category === Category.WRAPS || item.category === Category.BURGERS) {
      return filteredGroupIds.sort((a, b) => getModifierPriority(a) - getModifierPriority(b));
    }
    
    return filteredGroupIds;
  }, [item, selectedModifiers, optionQuantities]);

  // Sync selected drinks between selectedModifiers and optionQuantities when quantity changes
  useEffect(() => {
    if (!isOpen || !item || isEditing) return;
    const drinkGroupIds = ['meal_drinks', 'kids_drink_select'];
    
    if (quantity > 1) {
      let changed = false;
      const nextQuantities = { ...optionQuantities };
      
      drinkGroupIds.forEach(groupId => {
        if (visibleGroupIds.includes(groupId) && selectedModifiers[groupId] && selectedModifiers[groupId].length > 0) {
          selectedModifiers[groupId].forEach(opt => {
            const key = `${groupId}||${opt.name}`;
            if (!nextQuantities[key]) {
              nextQuantities[key] = 1;
              changed = true;
            }
          });
          // Clear from selectedModifiers so it doesn't duplicate
          if (changed) {
            setSelectedModifiers(prev => {
              const next = { ...prev };
              delete next[groupId];
              return next;
            });
          }
        }
      });
      
      if (changed) {
        setOptionQuantities(nextQuantities);
      }
    } else if (quantity === 1) {
      let changed = false;
      const nextModifiers = { ...selectedModifiers };
      const nextQuantities = { ...optionQuantities };
      
      drinkGroupIds.forEach(groupId => {
        if (visibleGroupIds.includes(groupId)) {
          // Find the first drink with quantity > 0
          const selectedDrinkKey = Object.keys(nextQuantities).find(key => key.startsWith(`${groupId}||`) && nextQuantities[key] > 0);
          if (selectedDrinkKey) {
            const [, optionName] = selectedDrinkKey.split('||');
            const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
            const option = group?.options.find(o => o.name === optionName);
            
            if (group && option && (!nextModifiers[groupId] || nextModifiers[groupId].length === 0)) {
              nextModifiers[groupId] = [{ ...option, groupId: group.id, groupName: group.name }];
              changed = true;
            }
            
            // Clear all quantities for this group
            Object.keys(nextQuantities).forEach(key => {
              if (key.startsWith(`${groupId}||`)) {
                delete nextQuantities[key];
                changed = true;
              }
            });
          }
        }
      });
      
      if (changed) {
        setSelectedModifiers(nextModifiers);
        setOptionQuantities(nextQuantities);
      }
    }
  }, [quantity, isOpen, item, isEditing, visibleGroupIds, selectedModifiers, optionQuantities]);

  // Auto-select first option for newly visible single-select groups
  useEffect(() => {
    if (!isOpen || !item) return;
    
    setSelectedModifiers(prev => {
      let changed = false;
      const next = { ...prev };
      
      visibleGroupIds.forEach(groupId => {
        const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
        if (group && !group.allowMultiple && group.options.length > 0) {
          // Skip auto-selecting for drinks and pot size so user can unselect or leave empty
          if (groupId === 'meal_drinks' || groupId === 'kids_drink_select' || groupId === 'sauce_pot_size_upgrade') return;
          
          if (!next[groupId] || next[groupId].length === 0) {
            if (group.options[0].price === 0) {
              next[groupId] = [{ ...group.options[0], groupId: group.id, groupName: group.name }];
              changed = true;
            }
          }
        }
      });
      
      return changed ? next : prev;
    });
  }, [visibleGroupIds, isOpen, item]);

  if (!isOpen || !item) return null;

  const handleOptionToggle = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers(prev => {
      const currentSelection = prev[group.id] || [];
      const isSelected = currentSelection.some(opt => opt.name === option.name);
      
      let newSelection: ModifierOption[];

      const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };

      if (group.allowMultiple) {
        if (isSelected) {
          newSelection = currentSelection.filter(opt => opt.name !== option.name);
        } else {
          if (group.maxSelection && currentSelection.length >= group.maxSelection) {
            return prev; // Max selection reached
          }
          newSelection = [...currentSelection, optionWithGroup];
        }
      } else {
        // Single selection: replace or toggle off
        if (isSelected) {
          newSelection = [];
        } else {
          newSelection = [optionWithGroup];
        }
      }
      
      return {
        ...prev,
        [group.id]: newSelection
      };
    });
  };

  const calculateTotal = () => {
    if ((item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot') && !isEditing) {
      let total = 0;
      
      const otherModifiers: ModifierOption[] = [];
      if (item.name === 'Sauce Pot') {
        Object.entries(selectedModifiers).forEach(([groupId, options]) => {
          if (visibleGroupIds.includes(groupId) && groupId !== 'sauce_pot_type') {
            otherModifiers.push(...options);
          }
        });
      }

      Object.entries(optionQuantities).forEach(([key, qty]) => {
        if (qty > 0) {
          const [groupId, optionName] = key.split('||');
          if (!visibleGroupIds.includes(groupId)) return;
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          const option = group?.options.find(o => o.name === optionName);
          if (group && option) {
            const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
            
            let finalOtherModifiers = otherModifiers;
            if (item.name === 'Sauce Pot' && ['Mushy Peas', 'Beans', 'Cheese'].includes(option.name)) {
              finalOtherModifiers = otherModifiers.filter(m => m.groupId !== 'sauce_pot_size_upgrade');
            }
            
            const combinedModifiers = item.name === 'Sauce Pot' ? [...finalOtherModifiers, optionWithGroup] : [optionWithGroup];
            const adjustedOptions = adjustModifierPrices(item.category, combinedModifiers);
            
            let itemPrice = item.price;
            adjustedOptions.forEach(opt => {
              itemPrice += opt.price;
            });
            total += itemPrice * qty;
          }
        }
      });
      return total;
    }

    const allSelectedOptions: ModifierOption[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, options]) => {
      if (visibleGroupIds.includes(groupId)) {
        allSelectedOptions.push(...options);
      }
    });

    const adjustedOptions = adjustModifierPrices(item.category, allSelectedOptions);

    if (item.id === 'custom_item') {
      const parsedCustomPrice = parseFloat(customPrice);
      return (!isNaN(parsedCustomPrice) ? parsedCustomPrice : 0) * quantity;
    }

    const calculatedCustomPrice = calculateChipsPrice(item.name, adjustedOptions, item.price);
    if (calculatedCustomPrice !== null) {
      return calculatedCustomPrice * quantity;
    }

    let total = item.price;
    adjustedOptions.forEach(opt => {
      total += opt.price;
    });
    return total * quantity;
  };

  const handleAddToCart = () => {
    if ((item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot') && !isEditing) {
      let added = false;
      
      // For Sauce Pot, we need to include other selected modifiers (like size)
      const otherModifiers: ModifierOption[] = [];
      if (item.name === 'Sauce Pot') {
        Object.entries(selectedModifiers).forEach(([groupId, options]) => {
          if (visibleGroupIds.includes(groupId) && groupId !== 'sauce_pot_type') {
            otherModifiers.push(...options);
          }
        });
      }

      Object.entries(optionQuantities).forEach(([key, qty]) => {
        if (qty > 0) {
          const [groupId, optionName] = key.split('||');
          if (!visibleGroupIds.includes(groupId)) return;
          const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
          const option = group?.options.find(o => o.name === optionName);
          if (group && option) {
            const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
            
            let finalOtherModifiers = otherModifiers;
            if (item.name === 'Sauce Pot' && ['Mushy Peas', 'Beans', 'Cheese'].includes(option.name)) {
              finalOtherModifiers = otherModifiers.filter(m => m.groupId !== 'sauce_pot_size_upgrade');
            }
            
            const combinedModifiers = item.name === 'Sauce Pot' ? [...finalOtherModifiers, optionWithGroup] : [optionWithGroup];
            const adjustedOptions = adjustModifierPrices(item.category, combinedModifiers);
            onAddToCart(item, adjustedOptions, qty, instructions.trim() || undefined);
            added = true;
          }
        }
      });
      if (added) {
        onClose();
      }
      return;
    }

    const allModifiers: ModifierOption[] = [];
    Object.entries(selectedModifiers).forEach(([groupId, options]) => {
      if (visibleGroupIds.includes(groupId)) {
        allModifiers.push(...options);
      }
    });

    const parsedCustomPrice = item.id === 'custom_item' && customPrice.trim() !== '' ? parseFloat(customPrice) : undefined;
    const finalCustomPrice = !isNaN(parsedCustomPrice as number) ? parsedCustomPrice : undefined;

    const drinkGroupIds = ['meal_drinks', 'kids_drink_select'];
    const hasDrinkGroup = visibleGroupIds.some(id => drinkGroupIds.includes(id));

    if (hasDrinkGroup && quantity > 1 && !isEditing) {
      const totalDrinksSelected = Object.entries(optionQuantities).reduce((sum, [key, qty]) => {
        const [groupId] = key.split('||');
        if (drinkGroupIds.includes(groupId)) return sum + qty;
        return sum;
      }, 0);

      if (totalDrinksSelected > 0) {
        Object.entries(optionQuantities).forEach(([key, qty]) => {
          if (qty > 0) {
            const [groupId, optionName] = key.split('||');
            if (drinkGroupIds.includes(groupId)) {
              const group = DEFAULT_MODIFIER_GROUPS.find(g => g.id === groupId);
              const option = group?.options.find(o => o.name === optionName);
              if (group && option) {
                const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
                
                const otherModifiers = allModifiers.filter(m => !drinkGroupIds.includes(m.groupId || ''));
                const combinedModifiers = [...otherModifiers, optionWithGroup];
                const adjustedOptions = adjustModifierPrices(item.category, combinedModifiers);
                
                onAddToCart(item, adjustedOptions, qty, instructions.trim() || undefined, finalCustomPrice);
              }
            }
          }
        });
        
        // Add remaining quantity without drinks
        const remainingQuantity = quantity - totalDrinksSelected;
        if (remainingQuantity > 0) {
          const otherModifiers = allModifiers.filter(m => !drinkGroupIds.includes(m.groupId || ''));
          const adjustedOptions = adjustModifierPrices(item.category, otherModifiers);
          onAddToCart(item, adjustedOptions, remainingQuantity, instructions.trim() || undefined, finalCustomPrice);
        }
        
        onClose();
        return;
      }
    }

    const adjustedOptions = adjustModifierPrices(item.category, allModifiers);
    onAddToCart(item, adjustedOptions, quantity, instructions.trim() || undefined, finalCustomPrice);
    onClose();
  };

  // Filter groups to show only visible ones, preserving the order from visibleGroupIds
  const visibleGroups = visibleGroupIds
    .map(id => DEFAULT_MODIFIER_GROUPS.find(g => g.id === id))
    .filter(Boolean) as ModifierGroup[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {visibleGroups.map(group => (
            <div key={group.id} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xs font-semibold text-slate-500">{group.name}</h3>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {group.options.map((option, idx) => {
                  const isDrinksMulti = ((item.name === 'Drinks' || item.name === 'Dips') && !isEditing) ||
                                        (item.name === 'Sauce Pot' && group.id === 'sauce_pot_type' && !isEditing) ||
                                        ((group.id === 'meal_drinks' || group.id === 'kids_drink_select') && quantity > 1 && !isEditing);
                  const optionKey = `${group.id}||${option.name}`;
                  const optionQty = optionQuantities[optionKey] || 0;
                  const isSelected = isDrinksMulti ? optionQty > 0 : selectedModifiers[group.id]?.some(opt => opt.name === option.name);
                  
                  return (
                    <div
                      key={`${group.id}-${idx}`}
                      onClick={() => {
                        if (isDrinksMulti) {
                          const totalDrinksSelected = Object.entries(optionQuantities).reduce((sum, [key, qty]) => {
                            const [gId] = key.split('||');
                            if (gId === group.id) return sum + qty;
                            return sum;
                          }, 0);
                          
                          if (item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot' || totalDrinksSelected < quantity) {
                            setOptionQuantities(prev => ({ ...prev, [optionKey]: (prev[optionKey] || 0) + 1 }));
                          }
                        } else {
                          handleOptionToggle(group, option);
                        }
                      }}
                      className={`
                        flex flex-col justify-center p-5 rounded-md border-2 text-left transition-all duration-200 cursor-pointer relative
                        ${isSelected 
                          ? 'border-slate-300 bg-slate-300 shadow-sm' 
                          : 'border-slate-300 hover:border-slate-200 hover:bg-slate-300'}
                      `}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className={`text-sm font-medium ${isSelected ? 'text-black' : 'text-black'}`}>{option.name}</span>
                      </div>
                      
                      {isDrinksMulti && isSelected && (
                        <div className="flex items-center justify-between w-full mt-auto bg-white rounded-lg border border-blue-200 p-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOptionQuantities(prev => ({ ...prev, [optionKey]: Math.max(0, (prev[optionKey] || 0) - 1) }));
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold"
                          >
                            -
                          </button>
                          <span className="font-bold text-blue-700">{optionQty}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const totalDrinksSelected = Object.entries(optionQuantities).reduce((sum, [key, qty]) => {
                                const [gId] = key.split('||');
                                if (gId === group.id) return sum + qty;
                                return sum;
                              }, 0);
                              
                              if (item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot' || totalDrinksSelected < quantity) {
                                setOptionQuantities(prev => ({ ...prev, [optionKey]: (prev[optionKey] || 0) + 1 }));
                              }
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom Price Input */}
          {item.id === 'custom_item' && (
            <div className="space-y-1 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-500">Custom Price (£)</h3>
              <input
                type="number"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Enter price..."
                className="w-full border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-1 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500">Special Instructions</h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Add any special requests (optional)..."
              className="w-full border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-24"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-4">
          {!((item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot') && !isEditing) && (
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 text-slate-500 hover:text-blue-600 font-bold text-xl w-10"
              >
                -
              </button>
              <span className="font-mono font-bold text-lg w-8 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-3 text-slate-500 hover:text-blue-600 font-bold text-xl w-10"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-between items-center"
          >
            <span>{(item.name === 'Drinks' || item.name === 'Dips' || item.name === 'Sauce Pot') && !isEditing ? `Add ${item.name} to Order` : 'Add to Order'}</span>
            <span className="bg-blue-800/30 px-3 py-1 rounded-lg">
              £{calculateTotal().toFixed(2)}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
