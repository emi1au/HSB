import { Order, CartItem, Category, ModifierOption } from '../types';
import { isInlineModifier, getModifierPriority, getModifierSuperGroup, getAbbreviation, sortModifiers } from '../utils/modifierUtils';
import { DELIVERY_CHARGE } from '../constants';

export const generateReceiptContent = (order: Order, tillName: string): string => {
  const ESC = '\x1b';
  const GS = '\x1d';

  const ALIGN_CENTER = ESC + 'a' + '\x01';
  const ALIGN_LEFT = ESC + 'a' + '\x00';
  const ALIGN_RIGHT = ESC + 'a' + '\x02';

  const TXT_NORMAL = GS + '!' + '\x00';
  const TXT_QUAD = GS + '!' + '\x11';
  const TXT_LARGE = GS + '!' + '\x10';

  const FONT_A = ESC + 'M' + '\x00';
  const FONT_B = ESC + 'M' + '\x01';

  const TXT_BOLD_ON = ESC + 'E' + '\x01' + ESC + 'G' + '\x01';
  const TXT_BOLD_OFF = ESC + 'E' + '\x00' + ESC + 'G' + '\x00';

  const INVERSE_ON = GS + 'B' + '\x01';
  const INVERSE_OFF = GS + 'B' + '\x00';

  const MAX_WIDTH = 48;

  const line = (left: string, right: string = '') => {
    const space = MAX_WIDTH - left.length - right.length;
    if (space < 0) return left + ' ' + right + '\n';
    return left + ' '.repeat(space) + right + '\n';
  };

  const boldLeftNormalRight = (left: string, right: string = '') => {
    const space = MAX_WIDTH - left.length - right.length;
    if (space < 0) return TXT_BOLD_ON + left + TXT_BOLD_OFF + ' ' + right + '\n';
    return TXT_BOLD_ON + left + TXT_BOLD_OFF + ' '.repeat(space) + right + '\n';
  };

  const divider = '-'.repeat(MAX_WIDTH) + '\n';

  let content = '';

  // Initialise
  content += ESC + '@';
  
  // Reset character spacing to 0
  content += ESC + ' ' + '\x00';
  
  // Set default line height
  content += ESC + '2';

  // Drawer kick
  if (order.paymentMethod === 'Cash') {
    content += '\x1b\x70\x00\x19\xfa';
  }

  // Header
  content += ALIGN_LEFT;
  content += line(
    'Hungry Shark',
    `Time: ${order.date.toLocaleTimeString('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`
  );

  // Divider above
  content += divider;

  // Order Number (clean & centred)
  content += '\n';
  content += ALIGN_CENTER;
  content += TXT_NORMAL;
  content += 'ORDER NUMBER:\n';

  content += TXT_QUAD;
  content += TXT_BOLD_ON;
  content += `B${order.id}\n`;
  content += TXT_BOLD_OFF;
  content += TXT_NORMAL;

  content += ALIGN_LEFT;
  content += '\n';

  // DELIVERY banner
  if (order.orderType === 'Delivery') {
    content += '\n';
    content += ALIGN_CENTER + TXT_LARGE + TXT_BOLD_ON + 'DELIVERY';
    content += TXT_BOLD_OFF + TXT_NORMAL + ALIGN_LEFT + '\n';
  }

  content += divider;

  // ===============================
  // CUSTOMER INFO
  // ===============================
  if (order.orderType === 'Delivery' && order.customer) {
    content += 'CUSTOMER INFO:\n';
    content += TXT_BOLD_ON + order.customer.phone + '\n';
    content += order.customer.address + '\n';
    content += order.customer.postcode + '\n';
    content += TXT_BOLD_OFF;
    content += divider;
  }

  // ===============================
  // SORT & GROUP ITEMS
  // ===============================
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

  const processedItems: CartItem[] = [];
  const extractedDrinks: CartItem[] = [];

  order.items.forEach(item => {
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
    processedItems.push(clonedItem);
  });

  const finalItems: CartItem[] = [];
  const drinksMap = new Map<string, CartItem>();

  [...processedItems, ...extractedDrinks].forEach(item => {
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

  const sortedItems = [...finalItems, ...drinksMap.values()].sort((a, b) => {
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

  const itemsByCategory: Record<string, CartItem[]> = {};
  sortedItems.forEach(item => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] =[];
    itemsByCategory[item.category].push(item);
  });

  // ===============================
  // ITEMS
  // ===============================
  CATEGORY_PRIORITY.forEach(cat => {
    const items = itemsByCategory[cat];
    if (!items || items.length === 0) return;

    items.forEach((item, index) => {
        let displayName = item.name;
        let displayModifiers =[...item.modifiers];

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

        let unitPrice = item.manualPrice ?? item.price;
        if (item.manualPrice === undefined) {
            unitPrice += item.modifiers.reduce((a, m) => a + m.price, 0);
        }

        const sizeModifiers = displayModifiers.filter(m => isInlineModifier(m.groupId, item.name));
        let otherModifiers = displayModifiers.filter(m => !isInlineModifier(m.groupId, item.name));

        let sizeTxt = sizeModifiers.map(m => {
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
            sizeTxt += sizeTxt ? ' (sauce)' : '(sauce)';
        }
        
        const leftTextBase = `${item.quantity} x ${displayName}`;
        let leftTextFull = sizeTxt ? `${leftTextBase} ${sizeTxt}` : leftTextBase;
        if (inlineToppingsText) {
            leftTextFull += inlineToppingsText;
        }
        const priceText = (unitPrice * item.quantity).toFixed(2);
        const space = MAX_WIDTH - leftTextFull.length - priceText.length;
        const padding = space > 0 ? ' '.repeat(space) : ' ';

        content += `${TXT_BOLD_ON}${leftTextFull}${padding}${priceText}${TXT_BOLD_OFF}\n`;

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

        const TXT_ITALIC_ON = '\x1b\x34';
        const TXT_ITALIC_OFF = '\x1b\x35';

        specialMods.forEach(m => {
            if (m.groupId === 'meal_drinks' || m.groupId === 'kids_drink_select') {
                content += `   + ${TXT_ITALIC_ON}Meal - ${m.name}${TXT_ITALIC_OFF}\n`;
            } else if (m.name === 'Meal') {
                content += `   + meal\n`;
            } else if (m.name === 'Burger Only' || m.name === 'Wrap Only') {
                // Skip these, as we show the drink or it's implied
            } else {
                const isItalic = m.name.toLowerCase().includes('meal') || 
                                 m.name.toLowerCase().includes('drink') || 
                                 m.name.toLowerCase().includes('on chips') || 
                                 m.name.toLowerCase().includes('pitta');
                if (isItalic) {
                    content += `   + ${TXT_ITALIC_ON}${m.name}${TXT_ITALIC_OFF}\n`;
                } else {
                    content += `   + ${m.name}\n`;
                }
            }
        });

        // Group modifiers
        const groupedModifiers = new Map<string, ModifierOption[]>();
        normalMods.forEach(m => {
            const key = getModifierSuperGroup(m.groupId);
            if(!groupedModifiers.has(key)) groupedModifiers.set(key,[]);
            groupedModifiers.get(key)?.push(m);
        });
        
        const modifierGroups = Array.from(groupedModifiers.values());

        modifierGroups.forEach(mods => {
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
            const indent = hasMealOrOnChips ? '      ' : '   ';
            
            content += `${indent}${modsText}\n`;
        });

        if (item.instructions) {
            content += `  Note: ${item.instructions}\n`;
        }
    });
    content += '\n'; // Space after each category
  });

  // ===============================
  // TOTAL
  // ===============================
  content += divider;
  content += line('TOTAL', order.total.toFixed(2));

  // Feed & cut (SUNMI / RawBT)
  content += '\n\n';
  // Try multiple cut commands to ensure compatibility
  content += '\x1d\x56\x41\x00'; // GS V A 0 (Full cut)

  return content;
};
