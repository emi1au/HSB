import React, { useState, useMemo } from 'react';
import { CartItem, ModifierOption, Category, CustomerDetails, OrderType } from '../types';
import { isInlineModifier, getModifierPriority, getModifierSuperGroup, getAbbreviation, sortModifiers } from '../utils/modifierUtils';

import { Printer, X, FileText, Copy, CheckCircle2 } from 'lucide-react';

interface ReceiptProps {
  items: CartItem[];
  total: number;
  orderNumber: number;
  date: Date;
  onClose: () => void;
  isOpen: boolean;
  paymentInfo?: {
    method: 'Cash' | 'Card';
    tendered?: number;
    change?: number;
  };
  onReprint?: (copies?: number) => void;
  customer?: CustomerDetails;
  orderType?: OrderType;
}

// Define specific order for receipt categories
const CATEGORY_PRIORITY =[
  Category.FISH,
  Category.BURGERS,
  Category.WRAPS,
  Category.KEBABS,
  Category.BITES,
  Category.KIDS_MEALS,
  Category.CHICKEN,
  Category.SIDES,
  Category.CHIPS,
  Category.SAUSAGES,
  Category.PIES,
  Category.DRINKS,
  Category.POTS
];

export const Receipt: React.FC<ReceiptProps> = ({ 
  items, 
  total, 
  orderNumber, 
  date, 
  onClose, 
  isOpen, 
  onReprint,
  customer,
  orderType
}) => {
  const [paperWidth, setPaperWidth] = useState<'57mm' | '80mm'>('80mm');
  const[doublePrint, setDoublePrint] = useState(false);

  // Process items to extract meal drinks into the DRINKS category
  const processedItems = useMemo(() => {
    const processed: CartItem[] = [];
    const extractedDrinks: CartItem[] = [];

    items.forEach(item => {
      const clonedItem = { ...item, modifiers: [...item.modifiers] };
      
      const drinkMods = clonedItem.modifiers.filter(m => 
        m.groupId === 'meal_drinks' || m.groupId === 'kids_drink_select'
      );

      if (drinkMods.length > 0) {
        clonedItem.modifiers = clonedItem.modifiers.filter(m => 
          m.groupId !== 'meal_drinks' && m.groupId !== 'kids_drink_select'
        );

        drinkMods.forEach(dm => {
          extractedDrinks.push({
            ...item,
            cartId: `${item.cartId}_${dm.id}_drink`,
            id: `${item.id}_${dm.id}_drink`,
            name: dm.name,
            price: dm.price,
            manualPrice: dm.price,
            category: Category.DRINKS,
            modifiers: [],
            quantity: item.quantity,
          });
        });
      }
      processed.push(clonedItem);
    });

      // Group drinks
      const finalItems: CartItem[] = [];
      const drinksMap = new Map<string, CartItem>();

      [...processed, ...extractedDrinks].forEach(item => {
        if (item.category === Category.DRINKS && item.modifiers.length === 0) {
          const key = `${item.name}_${item.price}_${item.manualPrice}`;
          if (drinksMap.has(key)) {
            const existing = drinksMap.get(key)!;
            existing.quantity += item.quantity;
          } else {
            drinksMap.set(key, { ...item });
          }
        } else {
          finalItems.push(item);
        }
      });

      return [...finalItems, ...drinksMap.values()];
    }, [items]);

  // Sort by Category
  const sortedItems = useMemo(() => {
    return [...processedItems].sort((a, b) => {
      const catA = CATEGORY_PRIORITY.indexOf(a.category);
      const catB = CATEGORY_PRIORITY.indexOf(b.category);
      if (catA !== catB) return catA - catB;
      
      if (a.category === Category.CHIPS || a.category === Category.POTS) {
        const getSizeScore = (item: CartItem) => {
          const sizeMod = item.modifiers.find(m => 
            m.groupId === 'size_chips' || 
            m.groupId === 'sauce_pot_size_upgrade' || 
            m.name.includes('Large') || 
            m.name.includes('Medium') || 
            m.name.includes('Small')
          );
          if (sizeMod) {
            if (sizeMod.name.includes('Large')) return 3;
            if (sizeMod.name.includes('Medium')) return 2;
            if (sizeMod.name.includes('Small')) return 1;
          }
          return 0;
        };
        const sizeA = getSizeScore(a);
        const sizeB = getSizeScore(b);
        if (sizeA !== sizeB) return sizeB - sizeA;

        const hasCheese = (item: CartItem) => item.modifiers.some(m => m.name.toLowerCase() === 'cheese');
        const cheeseA = hasCheese(a) ? 1 : 0;
        const cheeseB = hasCheese(b) ? 1 : 0;
        if (cheeseA !== cheeseB) return cheeseB - cheeseA;
      } else if (a.category === Category.SAUSAGES) {
        const hasChips = (item: CartItem) => item.modifiers.some(m => m.groupId === 'side_add_chips');
        const chipsA = hasChips(a) ? 1 : 0;
        const chipsB = hasChips(b) ? 1 : 0;
        if (chipsA !== chipsB) return chipsB - chipsA;
      }

      return a.name.localeCompare(b.name);
    });
  }, [items]);

  // Group by category
  const itemsByCategory = useMemo(() => {
      const groups: Record<string, CartItem[]> = {};
      sortedItems.forEach(item => {
          if (!groups[item.category]) groups[item.category] = [];
          groups[item.category].push(item);
      });
      return groups;
  }, [sortedItems]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const copies = doublePrint ? 2 : 1;
    if (onReprint) {
      onReprint(copies);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      <style>{`
        @media print {
          body > *:not(.receipt-print-container) {
            display: none !important;
          }
          .receipt-print-container {
            display: flex !important;
            justify-content: center;
            align-items: flex-start;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: auto;
            background: white;
            z-index: 9999;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0;
            size: auto; 
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="receipt-print-container bg-white md:rounded-xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] w-full md:w-auto">
        
        {/* Screen Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center no-print shrink-0">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              <h2 className="font-bold">Receipt Preview</h2>
            </div>
            
            <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-medium">
               <button 
                 onClick={() => setPaperWidth('57mm')}
                 className={`px-3 py-1.5 rounded-md transition-all ${paperWidth === '57mm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 57mm
               </button>
               <button 
                 onClick={() => setPaperWidth('80mm')}
                 className={`px-3 py-1.5 rounded-md transition-all ${paperWidth === '80mm' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
               >
                 80mm
               </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="overflow-y-auto p-8 bg-slate-100 flex justify-center flex-1">
           {/* Receipt Paper */}
           <div 
             className="bg-white shadow-xl p-6 text-black"
             style={{ 
               width: paperWidth === '57mm' ? '58mm' : '80mm',
               minHeight: '100mm',
               fontFamily: 'monospace',
               letterSpacing: '-1px',
               lineHeight: '1.4',
             }}
           >
              {/* Header Line */}
              <div className="flex justify-between items-end text-[14px] mb-2">
                <span>Hungry Shark</span>
                <span>Time: {date.toLocaleTimeString('en-GB', {timeZone: 'Europe/London', hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
              </div>

              {/* Black Line Separator */}
              <div className="border-b border-black mb-4"></div>

              {/* Order Number */}
              <div className="text-center mb-4">
                <div className="text-[14px] font-medium mb-1 uppercase">ORDER NUMBER:</div>
                <div className="text-[42px] font-bold leading-none tracking-tight">A{orderNumber}</div>
              </div>

              {/* Black Line Separator */}
              <div className="border-b border-black mb-4"></div>

              {/* Delivery Info */}
              {orderType === 'Delivery' && customer && (
                  <div className="mb-4">
                      <p className="uppercase mb-2 text-[12px] tracking-wider">CUSTOMER INFO:</p>
                      <p className="text-[14px] font-bold mb-1">{customer.phone}</p>
                      <p className="text-[14px]">{customer.address}</p>
                      <p className="text-[14px]">{customer.postcode}</p>
                      <div className="border-b border-black mt-4 mb-4"></div>
                  </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                {CATEGORY_PRIORITY.map((cat) => {
                    const catItems = itemsByCategory[cat];
                    if (!catItems || catItems.length === 0) return null;

                    return (
                        <div key={cat}>
                            <div>
                            {catItems.map((item, iIdx) => {
                                let displayName = item.name;
                                let displayModifiers = [...item.modifiers];

                                if (cat === Category.DRINKS) {
                                    if (displayModifiers.length > 0) {
                                        displayName = `(${displayModifiers[0].name})`;
                                        displayModifiers = displayModifiers.slice(1);
                                    } else {
                                        displayName = `(${displayName})`;
                                    }
                                } else if (cat === Category.KIDS_MEALS) {
                                    if (displayName === 'Fish Cake Kids') displayName = 'Kids Meal (Fish Cake)';
                                    else if (displayName === 'Cod Bites Kids') displayName = 'Kids Meal (Cod Bites (2))';
                                    else if (displayName === 'Nuggets Kids') displayName = 'Kids Meal (Nuggets (4))';
                                    else if (displayName === 'Strips Kids') displayName = 'Kids Meal (Strips (2))';
                                    else if (displayName === "Kid's 6 - Chips & Sauce") displayName = 'Kids Meal (Chips & Sauce)';
                                    else if (displayName === 'Sausage Kids') {
                                        const sausageTypeIdx = displayModifiers.findIndex(m => m.groupId === 'kids_sausage_type');
                                        if (sausageTypeIdx !== -1) {
                                            displayName = `Kids Meal (Sausage) (${displayModifiers[sausageTypeIdx].name})`;
                                            displayModifiers.splice(sausageTypeIdx, 1);
                                        } else {
                                            displayName = 'Kids Meal (Sausage)';
                                        }
                                    }
                                } else if (cat === Category.POTS) {
                                    if (displayName.toLowerCase().includes('sauce pot')) {
                                        const flavorIdx = displayModifiers.findIndex(m => m.groupId === 'sauce_pot_type');
                                        if (flavorIdx !== -1) {
                                            displayName = displayModifiers[flavorIdx].name;
                                            displayModifiers.splice(flavorIdx, 1);
                                        }
                                        
                                        // If there's no size modifier but it's a curry/gravy, add a default "Small pot" modifier
                                        const hasSize = displayModifiers.some(m => m.groupId === 'sauce_pot_size_upgrade');
                                        if (!hasSize &&['Mild Curry', 'Irish Curry', 'Fruit Curry', 'Gravy'].includes(displayName)) {
                                            displayModifiers.push({ id: 'small_pot', name: '(S) pot', price: 0, groupId: 'sauce_pot_size_upgrade' });
                                        }
                                    } else if (displayName.toLowerCase().includes('dip')) {
                                        const flavorIdx = displayModifiers.findIndex(m => m.groupId === 'dip_flavours');
                                        if (flavorIdx !== -1) {
                                            displayName = `Dips (${displayModifiers[flavorIdx].name})`;
                                            displayModifiers.splice(flavorIdx, 1);
                                        }
                                    }
                                    
                                    const sizeModIdx = displayModifiers.findIndex(m => m.groupId === 'sauce_pot_size_upgrade');
                                    if (sizeModIdx !== -1) {
                                        const sizeName = displayModifiers[sizeModIdx].name;
                                        if (sizeName.includes('L')) displayName += ' - (L)';
                                        else if (sizeName.includes('S')) displayName += ' - (S)';
                                        displayModifiers.splice(sizeModIdx, 1);
                                    }
                                } else if (cat === Category.BURGERS && displayName === 'Burger') {
                                    const flavorIdx = displayModifiers.findIndex(m => m.groupId === 'burger_flavor');
                                    if (flavorIdx !== -1) {
                                        displayName = displayModifiers[flavorIdx].name;
                                        displayModifiers.splice(flavorIdx, 1);
                                    }
                                } else if (cat === Category.KEBABS && displayName === 'Kebab Box') {
                                    const flavorIdx = displayModifiers.findIndex(m => m.groupId === 'kebab_flavor');
                                    let flavorName = '';
                                    if (flavorIdx !== -1) {
                                        flavorName = displayModifiers[flavorIdx].name;
                                        displayModifiers.splice(flavorIdx, 1);
                                    }
                                    
                                    const sizeIdx = displayModifiers.findIndex(m => m.groupId === 'size_kebab');
                                    let sizeName = '';
                                    if (sizeIdx !== -1) {
                                        sizeName = displayModifiers[sizeIdx].name;
                                        displayModifiers.splice(sizeIdx, 1);
                                    }

                                    displayName = `Box${flavorName ? ` (${flavorName})` : ''}${sizeName ? ` - ${sizeName}` : ''}`;
                                } else if (cat === Category.SAUSAGES) {
                                    const sizeMod = displayModifiers.find(m => m.groupId === 'sausage_size');
                                    const typeMod = displayModifiers.find(m => m.groupId === 'sausage_type');
                                    const chipsMod = displayModifiers.find(m => m.groupId === 'side_add_chips');
                                    
                                    let sausageName = 'Sausage';
                                    if (sizeMod) {
                                        const isLarge = sizeMod.name === 'Large' || sizeMod.name === 'L';
                                        sausageName = `(${isLarge ? 'L' : 'S'}) ${sausageName}`;
                                        displayModifiers = displayModifiers.filter(m => m.groupId !== 'sausage_size');
                                    } else {
                                        sausageName = `(S) ${sausageName}`;
                                    }

                                    if (typeMod) {
                                        if (typeMod.name === 'Battered') {
                                            sausageName += ' (Battered)';
                                        }
                                        displayModifiers = displayModifiers.filter(m => m.groupId !== 'sausage_type');
                                    }

                                    if (chipsMod) {
                                        let chipsName = chipsMod.name;
                                        if (chipsName.includes('Large') || chipsName.includes('(L)')) chipsName = '(L) Chips';
                                        else if (chipsName.includes('Medium') || chipsName.includes('(M)')) chipsName = '(M) Chips';
                                        else if (chipsName.includes('Small') || chipsName.includes('(S)')) chipsName = '(S) Chips';
                                        else chipsName = 'Chips';
                                        
                                        sausageName += ` - ${chipsName}`;
                                        displayModifiers = displayModifiers.filter(m => m.groupId !== 'side_add_chips');
                                    }
                                    
                                    displayName = sausageName;
                                } else if (cat === Category.CHICKEN && displayName === 'Chicken Curry') {
                                    const styleIdx = displayModifiers.findIndex(m => m.groupId === 'chicken_curry_style');
                                    if (styleIdx !== -1) {
                                        const styleName = displayModifiers[styleIdx].name;
                                        if (styleName === 'Chips & Rice') {
                                            displayName = 'Chicken Curry, Chips & Rice';
                                        } else {
                                            displayName = `Chicken Curry & ${styleName}`;
                                        }
                                        displayModifiers.splice(styleIdx, 1);
                                    }
                                }

                                let itemTotal = 0;
                                if (item.manualPrice !== undefined) {
                                    itemTotal = item.manualPrice * item.quantity;
                                } else {
                                    const modsCost = item.modifiers.reduce((s, m) => s + m.price, 0);
                                    itemTotal = (item.price + modsCost) * item.quantity;
                                }
                                
                                const sizeModifiers = displayModifiers.filter(m => isInlineModifier(m.groupId, item.name));
                                let otherModifiers = displayModifiers.filter(m => !isInlineModifier(m.groupId, item.name));
                                
                                let sizeText = sizeModifiers.map(m => {
                                    const superGroup = getModifierSuperGroup(m.groupId);
                                    if (superGroup === 'add_chips' || superGroup === 'type') {
                                        return `(${m.name})`;
                                    }
                                    if (superGroup === 'size') {
                                        if (cat === Category.BURGERS) {
                                            return `(${m.name})`;
                                        }
                                        if (cat === Category.CHIPS || cat === Category.POTS) {
                                            if (m.name === 'L' || m.name.includes('Large') || m.name === '(L) pot') return '(L)';
                                            if (m.name === 'M' || m.name.includes('Medium')) return '(M)';
                                            if (m.name === 'S' || m.name.includes('Small') || m.name === '(S) pot') return '(S)';
                                        }
                                        return `- ${m.name}`;
                                    }
                                    return `(${m.name})`;
                                }).join(' ');

                                let inlineToppingsText = '';
                                if (cat === Category.CHIPS) {
                                    const sauceMods = otherModifiers.filter(m => m.groupId === 'chips_sauce');
                                    if (sauceMods.length > 0) {
                                        sauceMods.sort((a, b) => {
                                            if (a.name.toLowerCase() === 'cheese') return 1;
                                            if (b.name.toLowerCase() === 'cheese') return -1;
                                            return 0;
                                        });
                                        inlineToppingsText = ' - ' + sauceMods.map(m => m.name).join(' & ');
                                        otherModifiers = otherModifiers.filter(m => m.groupId !== 'chips_sauce');
                                    }
                                } else if (item.name === 'Chips' && otherModifiers.some(m => m.groupId === 'chips_sauce')) {
                                    sizeText += sizeText ? ' (sauce)' : '(sauce)';
                                }
                                
                                // Sort modifiers
                                otherModifiers.sort((a, b) => getModifierPriority(a.groupId) - getModifierPriority(b.groupId));

                                const specialMods = otherModifiers.filter(m => 
                                    getModifierSuperGroup(m.groupId) === 'size' ||
                                    m.groupId === 'meal_drinks' ||
                                    m.groupId === 'kids_drink_select' ||
                                    m.groupId === 'side_add_chips' ||
                                    m.groupId === 'chicken_curry_style' ||
                                    m.name.toLowerCase().includes('meal') || 
                                    m.name.toLowerCase().includes('on chips') ||
                                    m.name.toLowerCase().includes('pitta') ||
                                    m.name === 'Burger Only' ||
                                    m.name === 'Wrap Only'
                                );
                                const normalMods = otherModifiers.filter(m => !specialMods.includes(m));

                                // Group modifiers
                                const groupedModifiers = new Map<string, ModifierOption[]>();
                                normalMods.forEach(m => {
                                    const key = getModifierSuperGroup(m.groupId);
                                    if(!groupedModifiers.has(key)) groupedModifiers.set(key,[]);
                                    groupedModifiers.get(key)?.push(m);
                                });
                                
                                const modifierGroups = Array.from(groupedModifiers.values());

                                return (
                                    <div key={`i-${iIdx}`} className={iIdx < catItems.length - 1 ? "mb-0" : ""}>
                                        <div className="flex justify-between items-start text-[15px] leading-snug mb-0 font-black">
                                            <span className="pr-2">
                                                <span>{item.quantity} x {displayName}</span>
                                                {sizeText && <span> {sizeText}</span>}
                                                {inlineToppingsText && <span>{inlineToppingsText}</span>}
                                            </span>
                                            <span>{itemTotal.toFixed(2)}</span>
                                        </div>
                                        {otherModifiers.length > 0 && (
                                            <div className="leading-relaxed text-slate-500 font-normal pl-4">
                                                {specialMods.map((m, idx) => {
                                                    if (m.groupId === 'meal_drinks' || m.groupId === 'kids_drink_select') {
                                                        return (
                                                            <div key={`special-${idx}`} className="mb-0.5 text-[13px]">
                                                                + <span className="italic">Meal - {m.name}</span>
                                                            </div>
                                                        );
                                                    } else if (m.name === 'Meal') {
                                                        return (
                                                            <div key={`special-${idx}`} className="mb-0.5 text-[13px]">
                                                                + meal
                                                            </div>
                                                        );
                                                    } else if (m.name === 'Burger Only' || m.name === 'Wrap Only') {
                                                        return null;
                                                    } else {
                                                        const isItalic = m.name.toLowerCase().includes('meal') || 
                                                                         m.name.toLowerCase().includes('drink') || 
                                                                         m.name.toLowerCase().includes('on chips') || 
                                                                         m.name.toLowerCase().includes('pitta');
                                                        return (
                                                            <div key={`special-${idx}`} className={`mb-0.5 text-[13px] ${isItalic ? 'italic' : ''}`}>
                                                                + {m.name}
                                                            </div>
                                                        );
                                                    }
                                                })}
                                                {modifierGroups.map((mods, mIdx) => {
                                                    const isSalad = mods.some(m => getModifierSuperGroup(m.groupId) === 'salad');
                                                    const isSauce = mods.some(m => getModifierSuperGroup(m.groupId) === 'sauce_basic' || getModifierSuperGroup(m.groupId) === 'sauce_toppings');
                                                    
                                                    const sortedMods = sortModifiers(mods, isSalad, isSauce);
                                                    const formattedMods = sortedMods.map(m => {
                                                      if (isSalad || isSauce) {
                                                        return getAbbreviation(m.name, isSalad);
                                                      }
                                                      return m.name;
                                                    });

                                                    const separator = (isSalad || isSauce) ? '...' : ', ';
                                                    const modsText = `+ (${formattedMods.join(separator)})`;

                                                    const hasMealOrOnChips = specialMods.some(m => 
                                                        m.groupId === 'meal_drinks' || 
                                                        m.groupId === 'kids_drink_select' || 
                                                        m.groupId === 'side_add_chips' ||
                                                        m.groupId === 'chicken_curry_style' ||
                                                        m.name.toLowerCase().includes('meal') ||
                                                        m.name.toLowerCase().includes('on chips')
                                                    );
                                                    const plClass = hasMealOrOnChips ? 'pl-4' : '';
                                                    return (
                                                        <div key={mIdx} className={`mb-0.5 text-[13px] ${plClass}`}>
                                                            {modsText}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {item.instructions && (
                                            <div className="text-[13px] leading-snug text-slate-700 pl-4 mt-0.5 italic">
                                                Note: {item.instructions}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            </div>
                        </div>
                    );
                })}
              </div>

              {/* Total Section */}
              <div className="border-t border-black border-dashed pt-2 mt-2">
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-[12px] uppercase tracking-wider">TOTAL</span>
                     <span className="text-[15px]">{total.toFixed(2)}</span>
                  </div>
              </div>

           </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center gap-3 no-print shrink-0">
          <button
            onClick={() => setDoublePrint(!doublePrint)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all ${doublePrint ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-inner' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
          >
            {doublePrint ? <CheckCircle2 size={20} className="text-blue-600" /> : <Copy size={20} />}
            {doublePrint ? 'Double Print (x2)' : 'Single Print'}
          </button>

          <div className="flex gap-3">
            <button 
                onClick={onClose} 
                className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
                Done
            </button>
            <button 
                onClick={handlePrint} 
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
            >
                <Printer size={20} />
                {onReprint ? `Print (${doublePrint ? 'x2' : 'x1'})` : 'Print'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};