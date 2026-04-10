
import React, { useMemo, useState } from 'react';
import { MenuItem, Category, ModifierGroup, ModifierOption } from '../types';
import { CURRENCY, getCategoryColor, getItemEmoji } from '../constants';
import { adjustModifierPrices } from '../utils/modifierUtils';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

const getBgColorClass = (colorName: string) => {
  const colors: Record<string, string> = {
    yellow: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600 text-yellow-950',
    blue: 'bg-blue-600 hover:bg-blue-700 border-blue-700 text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-amber-950',
    rose: 'bg-rose-600 hover:bg-rose-700 border-rose-700 text-white',
    teal: 'bg-teal-600 hover:bg-teal-700 border-teal-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 border-red-700 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 border-orange-600 text-orange-950',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 border-purple-700 text-white',
    lime: 'bg-lime-500 hover:bg-lime-600 border-lime-600 text-lime-950',
    pink: 'bg-pink-600 hover:bg-pink-700 border-pink-700 text-white',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 border-cyan-700 text-white',
    slate: 'bg-slate-700 hover:bg-slate-800 border-slate-800 text-white',
    grey: 'bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800',
    slateSoft: 'bg-slate-300 hover:bg-slate-400 border-slate-400 text-slate-900',
  };
  return colors[colorName] || colors.slate;
};

export interface MenuGridProps {
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
  onAddToOrder: (item: MenuItem, modifiers: ModifierOption[], quantity: number) => void;
  onOpenModal: (item: MenuItem, currentModifiers: ModifierOption[]) => void;
  groupByCategory?: boolean;
  viewMode?: 'detailed' | 'compact';
  activeMasterTab?: string;
}

// IDs of groups that are candidates for inline display
const INLINE_GROUP_IDS = [
  'size_fish', 
  'size_burger', 
  'size_kebab',
  'kebab_flavor', 
  'kebab_base',
  'size_chips', 
  'size_side',
  'size_sausage_plain', 
  'size_sausage_battered',
  'cod_bites_size',
  'fish_chip_opt_med', 
  'fish_chip_opt_lrg', 
  'fish_chip_opt', 
  'chips_cod_bites', 
  'chips_fish_cake', 
  'pie_chips_opt', 
  'opt_chips_sausage_small', 
  'opt_chips_sausage_large', 
  'opt_chips_battered_small', 
  'opt_chips_battered_large', 
  'meal_upgrade',
  'wrap_meal_upgrade', 
  'meal_drinks', 
  'pie_addons',
  'salad', 
  'sauce', 
  'sauce_pot_type', 
  'sauce_pot_size_upgrade', 
  'side_add_chips', 
  'chicken_breast_chips', 
  'chicken_curry_style', 
  'kids_drink_select', 
  'kids_sausage_type', 
  'kids_sauce_choice', 
  'chips_sauce', 
  'condiments', 
  'all_drinks_opt', 
  'dip_flavours',
  'pie_flavor',
  'sausage_type',
  'sausage_size',
  'add_chips_standard',
  'wrap_flavor',
  'burger_flavor',
  'kids_meal_type'
];

const MenuCard: React.FC<{
  item: MenuItem;
  allGroups: ModifierGroup[];
  onAdd: (item: MenuItem, modifiers: ModifierOption[], quantity: number) => void;
  onCustomize: (item: MenuItem, modifiers: ModifierOption[]) => void;
  viewMode: 'detailed' | 'compact';
}> = ({ item, allGroups = [], onAdd, onCustomize, viewMode }) => {
  const quantity = 1;
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize selections lazily
  const [selections, setSelections] = useState<ModifierOption[]>(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];

    const defaults: ModifierOption[] = [];
    const itemGroups = (item.modifierGroupIds || [])
      .map(id => allGroups.find(g => g.id === id))
      .filter(Boolean) as ModifierGroup[];

    itemGroups.forEach((g) => {
      // Auto-select defaults if single select and has options
      if (!g.allowMultiple && g.options.length > 0) {
         // Default logic: Select first if it's free
         if (g.options[0].price === 0) {
             defaults.push({ ...g.options[0], groupId: g.id, groupName: g.name });
         }
      }
    });
    return defaults;
  });

  // Identify Direct Groups
  const directGroups = useMemo(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];
    return (item.modifierGroupIds || [])
      .map(id => allGroups.find(g => g.id === id))
      .filter(Boolean) as ModifierGroup[];
  }, [item, allGroups]);

  // Calculate Visible Groups using Tree Traversal (DFS to keep related groups together)
  const visibleGroups = useMemo(() => {
    if (!allGroups || !Array.isArray(allGroups)) return [];
    
    const visibleSet = new Set<string>();
    const result: ModifierGroup[] = [];

    const processGroup = (group: ModifierGroup) => {
      if (visibleSet.has(group.id)) return;
      visibleSet.add(group.id);
      result.push(group);

      const activeOptions = selections.filter(s => s.groupId === group.id);
      activeOptions.forEach(opt => {
        const triggers = [];
        if (opt.triggersGroupId) triggers.push(opt.triggersGroupId);
        if (opt.triggersGroupIds) triggers.push(...opt.triggersGroupIds);
        
        triggers.forEach(tId => {
          const tGroup = allGroups.find(g => g.id === tId);
          if (tGroup && !visibleSet.has(tId)) {
            processGroup(tGroup);
          }
        });
      });
    };

    directGroups.forEach(processGroup);

    return result;
  }, [directGroups, selections, allGroups]);

  // Filter selections
  const effectiveSelections = useMemo(() => {
     const visibleIds = new Set(visibleGroups.map(g => g.id));
     const filtered = selections.filter(s => s.groupId && visibleIds.has(s.groupId));
     return adjustModifierPrices(item.category, filtered);
  }, [selections, visibleGroups, item.category]);

  // Filter for Inline Display based on predefined list
  const inlineGroups = useMemo(() => 
    visibleGroups.filter(g => INLINE_GROUP_IDS.includes(g.id)),
  [visibleGroups]);

  // Use the first inline group for the top row
  const topRowGroup = useMemo(() => {
      return inlineGroups[0] || null;
  }, [inlineGroups]);

  const topRowOptions = topRowGroup ? topRowGroup.options : [];

  const collapsibleGroups = useMemo(() => {
      return visibleGroups.filter(g => g.id !== topRowGroup?.id);
  }, [visibleGroups, topRowGroup]);

  const showChevron = collapsibleGroups.length > 0;

  const handleSelection = (group: ModifierGroup, option: ModifierOption) => {
    let newSelections = [...selections];
    const optionWithGroup = { ...option, groupId: group.id, groupName: group.name };
    
    if (!group.allowMultiple) {
      const isAlreadySelected = newSelections.some(s => s.name === option.name && s.groupId === group.id);
      newSelections = newSelections.filter(s => s.groupId !== group.id && !group.options.find(o => o.name === s.name));
      if (!isAlreadySelected) {
        newSelections.push(optionWithGroup);
      }
    } else {
      const exists = newSelections.find(s => s.name === option.name);
      if (exists) {
        newSelections = newSelections.filter(s => s.name !== option.name);
      } else {
        newSelections.push(optionWithGroup);
      }
    }

    // Handle Triggers
    const getTriggered = (opts: ModifierOption[]) => {
        const ids = new Set<string>();
        opts.forEach(s => {
            if (s.triggersGroupId) ids.add(s.triggersGroupId);
            if (s.triggersGroupIds) s.triggersGroupIds.forEach(id => ids.add(id));
        });
        return ids;
    };

    const prevTriggered = getTriggered(selections);
    const nextTriggered = getTriggered(newSelections);
    const newGroupIds = [...nextTriggered].filter(id => !prevTriggered.has(id));
    const hiddenGroupIds = [...prevTriggered].filter(id => !nextTriggered.has(id));

    if (allGroups && Array.isArray(allGroups)) {
      const hiddenSelections = selections.filter(s => s.groupId && hiddenGroupIds.includes(s.groupId));
      newGroupIds.forEach(gid => {
          const g = allGroups.find(gr => gr.id === gid);
          if (!g) return;
          let carriedOver = false;
          if (hiddenSelections.length > 0) {
              for (const hiddenSel of hiddenSelections) {
                  const match = g.options.find(o => o.name === hiddenSel.name);
                  if (match) {
                      const exists = newSelections.some(s => s.groupId === gid && s.name === match.name);
                      if (!exists) newSelections.push({ ...match, groupId: gid, groupName: g.name });
                      carriedOver = true;
                      if (!g.allowMultiple) break; 
                  }
              }
          }
          if (!carriedOver && !g.allowMultiple && g.options.length > 0) {
              const alreadyHas = newSelections.some(s => g.options.some(o => o.name === s.name));
              if (!alreadyHas) newSelections.push({ ...g.options[0], groupId: g.id, groupName: g.name });
          }
      });
    }
    setSelections(newSelections);
  };

  const currentPrice = item.price + effectiveSelections.reduce((acc, curr) => acc + curr.price, 0);
  const colorName = getCategoryColor(item.category);

  // --- RENDER LOGIC ---

  // 1. COMPACT TILE GRID VIEW (5x4 Style)
  if (viewMode === 'compact') {
    const colorName = getCategoryColor(item.category);

    return (
      <div 
        onClick={() => onCustomize(item, effectiveSelections)}
        className={`
          aspect-[5/2] flex flex-col justify-center p-2 text-center rounded cursor-pointer transition-transform group overflow-hidden relative ${getBgColorClass(colorName)}
        `}
      >
         {/* Top Row: Name */}
         <div className="z-10 ">
            <h3 className="font-medium text-xs text-base leading-tight break-words">
              <span className="mr-1.5">{getItemEmoji(item)}</span>
              {item.name}
            </h3>
         </div>

      </div>
    );
  }

  // 2. DETAILED CARD VIEW
  return (
    <div 
      className={`rounded-xl shadow-sm border overflow-hidden transition-all duration-300 ${getBgColorClass(colorName)} ${isExpanded ? 'ring-2 ring-black/20 shadow-md' : ''}`}
    >
      {/* Header Row - Flexible Layout */}
      <div className="flex flex-col min-h-[90px] p-4 gap-4">
        
        {/* Left Area: Name & Price -> Opens Modal */}
        <div 
          className="flex-1 flex flex-col justify-center cursor-pointer hover:opacity-70 transition-opacity group min-w-[140px]"
          onClick={() => onCustomize(item, effectiveSelections)}
          title="Click to Customize"
        >
           <h3 className="font-extrabold leading-none mb-1 transition-colors">
             <span className="mr-1.5">{getItemEmoji(item)}</span>
             {item.name}
           </h3>
           <p className="text-sm font-bold opacity-80">{CURRENCY}{item.price.toFixed(2)} Base</p>
        </div>

        {/* Center Area: Primary Inline Group (Sizes ONLY) */}
        {topRowGroup && (
           <div className="flex-1 flex flex-wrap gap-2 items-center justify-start">
              {topRowOptions.map(opt => {
                const isSelected = selections.some(s => s.name === opt.name);
                const isActiveColor = 'yellow';

                return (
                  <button
                    key={opt.name}
                    onClick={(e) => { e.stopPropagation(); handleSelection(topRowGroup, opt); }}
                    className={`text-sm px-4 py-2.5 rounded-lg font-bold transition-all border shadow-sm flex-grow md:flex-grow-0 text-center ${
                      isSelected 
                        ? `bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/50 transform scale-105` 
                        : 'bg-white text-slate-900 border-white hover:bg-slate-100'
                    }`}
                  >
                    {opt.name}
                    {opt.price > 0 && <span className="ml-1 opacity-80 text-xs font-normal">+{CURRENCY}{opt.price.toFixed(2)}</span>}
                  </button>
                );
              })}
           </div>
        )}

        {/* Right Area: Actions */}
        <div className="flex items-center gap-3 shrink-0 justify-between mt-2 md:mt-0">
           
           {/* Add Button */}
           <button
             onClick={(e) => {
               e.stopPropagation();
               if (item.id === 'custom_item') {
                 onCustomize(item, effectiveSelections);
               } else {
                 onAdd(item, effectiveSelections, quantity);
               }
             }}
             className="bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white pl-5 pr-4 py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-3 group whitespace-nowrap"
           >
             <span>Add to Order</span>
             <span className="bg-slate-700 dark:bg-slate-900 group-hover:bg-slate-600 px-2 py-0.5 rounded text-sm text-slate-200 font-mono">
               {CURRENCY}{currentPrice.toFixed(2)}
             </span>
           </button>
           
           {/* Expand/Collapse Chevron */}
           {showChevron && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 setIsExpanded(!isExpanded);
               }} 
               className={`p-2 rounded-full hover:bg-black/10 transition-all transform duration-300 ${isExpanded ? 'rotate-180 bg-black/10' : ''}`}
               title={isExpanded ? "Collapse Options" : "Show Options"}
             >
               {isExpanded ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
             </button>
           )}
        </div>
      </div>

      {/* Expanded Dashboard Body */}
      {isExpanded && showChevron && (
        <div className="px-5 pb-6 pt-4 border-t border-black/10 animate-in slide-in-from-top-2 fade-in duration-200 bg-black/5">
          <div className="flex flex-row flex-wrap gap-8">
            {collapsibleGroups.map(group => (
              <div key={group.id} className="flex-1 min-w-[180px]">
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 border-b border-black/10 pb-1 opacity-80">{group.name}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map(opt => {
                    const isSelected = selections.some(s => s.name === opt.name);
                    
                    return (
                      <button
                        key={opt.name}
                        onClick={(e) => { e.stopPropagation(); handleSelection(group, opt); }}
                        className={`text-sm px-5 py-3 rounded-lg font-bold transition-all border shadow-sm text-center flex-grow md:flex-grow-0 ${
                          isSelected 
                            ? `bg-slate-900 text-white border-slate-900 ring-2 ring-slate-900/50` 
                            : 'bg-white text-slate-900 border-white hover:bg-slate-100'
                        }`}
                      >
                        {opt.name}
                        {opt.price > 0 && <span className="ml-1 opacity-80 text-xs font-normal">+{CURRENCY}{opt.price.toFixed(2)}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MenuGrid: React.FC<MenuGridProps> = ({ 
  items, 
  modifierGroups, 
  onAddToOrder, 
  onOpenModal, 
  groupByCategory = false,
  viewMode = 'detailed',
  activeMasterTab
}) => {
  
  const groupedItems = useMemo<Record<string, MenuItem[]>>(() => {
    // If grouping is requested AND we are in detailed mode
    if (groupByCategory && viewMode === 'detailed') {
        const groups: Record<string, MenuItem[]> = {};
        const categoriesPresent = new Set(items.map(i => i.category));
        Object.values(Category).forEach(cat => {
          if (categoriesPresent.has(cat)) {
            const catItems = items.filter(i => i.category === cat);
            groups[cat] = catItems;
          }
        });
        return groups;
    }
    return { 'All': items };
  }, [items, groupByCategory, viewMode]);

  if (activeMasterTab === 'TV1' && viewMode === 'compact') {
    const col1Names = ['Chicken Breast', 'Chicken Curry', 'Rice', 'empty', 'Drinks'];
    const col2Names = ['Kebab Box', 'Wrap', 'Burger', 'empty', 'Green Salad'];
    const col3Names = ['Chips','Chip Butty','Kids Meal', 'empty', 'Bread Roll'];
    const col4Names = ['Cod', 'Cod Bites', 'Fish Cake','empty', 'Dips'];
    const col5Names = ['Sausage', 'Pie','empty','empty', 'Sauce Pot'];

    const getItems = (names: string[]) => names.map(name => name === 'empty' ? null : items.find(i => i.name === name));

    return (
      <div className="h-full overflow-y-auto pb-32 p-2 custom-scrollbar">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col gap-4">
            {getItems(col1Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-1-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col2Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-2-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col3Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-3-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col4Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-4-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col5Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-5-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeMasterTab === 'TV2' && viewMode === 'compact') {
    const col1Names = [];
    const col2Names = [];
    const col3Names = [];
    const col4Names = [];
    const col5Names = [];

    const getItems = (names: string[]) => names.map(name => name === 'empty' ? null : items.find(i => i.name === name));

    return (
      <div className="h-full overflow-y-auto pb-32 p-2 md:p-4 custom-scrollbar">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col gap-4">
            {getItems(col1Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-1-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col2Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-2-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col3Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-3-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col4Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-4-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col5Names).map((item, idx) => (
              item ? <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} /> : <div key={`empty-5-${idx}`} className="aspect-[5/2]"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeMasterTab === 'TV3' && viewMode === 'compact') {
    const col1Names = [];
    const col2Names = [];
    const col3Names = [];
    const col4Names = [];
    const col5Names = [];

    const getItems = (names: string[]) => names.map(name => items.find(i => i.name === name)).filter(Boolean) as MenuItem[];

    return (
      <div className="h-full overflow-y-auto pb-32 p-2 md:p-4 custom-scrollbar">
        <div className="grid grid-cols-5 gap-4">
          <div className="flex flex-col gap-4">
            {getItems(col1Names).map(item => (
              <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col2Names).map(item => (
              <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col3Names).map(item => (
              <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col4Names).map(item => (
              <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} />
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {getItems(col5Names).map(item => (
              <MenuCard key={item.id} item={item} allGroups={modifierGroups} onAdd={onAddToOrder} onCustomize={onOpenModal} viewMode={viewMode} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pb-32 p-2 md:p-4 space-y-8 custom-scrollbar">
      {(Object.entries(groupedItems) as [string, MenuItem[]][]).map(([categoryName, categoryItems]) => {
        // Only show headers in detailed mode when grouped
        const showHeader = viewMode === 'detailed' && categoryName !== 'All';
        const catColor = categoryName !== 'All' ? getCategoryColor(categoryName as Category) : 'slate';

        // Map colors for header text to match tile theme loosely
        let headerClass = `text-${catColor}-600`;
        if (catColor === 'amber') headerClass = 'text-amber-600';
        if (catColor === 'rose') headerClass = 'text-rose-700';

        return (
          <div key={categoryName} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {showHeader && (
              <div className="flex items-center gap-4 mb-4 pb-2 border-b-2 border-slate-200 dark:border-slate-800">
                <h3 className={`text-xl font-black uppercase tracking-widest ${headerClass} dark:text-white`}>
                  {categoryName}
                </h3>
                <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
                  {categoryItems.length}
                </span>
              </div>
            )}
            
            <div className={viewMode === 'detailed' 
              ? "grid grid-cols-3 gap-4" 
              : "grid grid-cols-5 gap-4"
            }>
              {categoryItems.map((item) => (
                <MenuCard 
                  key={item.id} 
                  item={item} 
                  allGroups={modifierGroups}
                  onAdd={onAddToOrder}
                  onCustomize={onOpenModal}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuGrid;
