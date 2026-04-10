
import { ModifierOption } from '../types';

export const getAbbreviation = (name: string, isSalad: boolean): string => {
  const lowerName = name.toLowerCase();
  if (isSalad) {
    if (lowerName === 'all salad') return 'all salad';
    if (lowerName === 'lettuce') return 'let';
    if (lowerName === 'onion') return 'oni';
    if (lowerName === 'tomato') return 'tom';
    if (lowerName === 'cucumber') return 'cum';
    if (lowerName === 'jalapeno' || lowerName === 'jalapenos') return 'jal';
    if (lowerName === 'slice cheese' || lowerName === 'sliced cheese') return 'slice chs';
    if (lowerName === 'mozzarella cheese') return 'mozz chs';
  } else {
    // Sauce
    if (lowerName === 'all sauce') return 'All Sauce';
    if (lowerName === 'chilli sauce' || lowerName === 'chilli') return 'chil';
    if (lowerName === 'garlic mayo' || lowerName === 'garlic') return 'Garl';
    if (lowerName === 'mayo') return 'mayo';
    if (lowerName === 'ketchup') return 'ket';
    if (lowerName === 'mint sauce' || lowerName === 'mint') return 'mint';
    if (lowerName === 'bbq sauce' || lowerName === 'bbq') return 'bbq';
    if (lowerName === 'burger sauce') return 'bur';
    if (lowerName === 'relish') return 'rel';
    if (lowerName === 'sauce separate') return 'sau sep';
  }
  return name;
};

export const sortModifiers = (mods: ModifierOption[], isSalad: boolean, isSauce: boolean): ModifierOption[] => {
  if (isSalad) {
    const order = ['all salad', 'lettuce', 'onion', 'tomato', 'cucumber', 'jalapeno', 'jalapenos', 'slice cheese', 'sliced cheese', 'mozzarella cheese'];
    return [...mods].sort((a, b) => {
      const idxA = order.indexOf(a.name.toLowerCase());
      const idxB = order.indexOf(b.name.toLowerCase());
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }
  if (isSauce) {
    const order = ['all sauce', 'garlic mayo', 'garlic', 'chilli sauce', 'chilli', 'mayo', 'ketchup', 'mint sauce', 'mint', 'bbq sauce', 'bbq', 'burger sauce', 'relish', 'sauce separate'];
    return [...mods].sort((a, b) => {
      const idxA = order.indexOf(a.name.toLowerCase());
      const idxB = order.indexOf(b.name.toLowerCase());
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });
  }
  return mods;
};

export const adjustModifierPrices = (itemCategory: string, modifiers: ModifierOption[]): ModifierOption[] => {
  const adjusted = modifiers.map(m => ({ ...m }));

  if (itemCategory === 'Sausages') {
    const isLarge = adjusted.some(m => m.groupId === 'sausage_size' && m.name === 'Large');
    const isBattered = adjusted.some(m => m.groupId === 'sausage_type' && m.name === 'Battered');
    
    if (isLarge && isBattered) {
      const batteredMod = adjusted.find(m => m.groupId === 'sausage_type' && m.name === 'Battered');
      if (batteredMod) {
        batteredMod.price = 0.30; // 1.50 (base) + 0.70 (large) + 0.30 (battered) = 2.50
      }
    }
  }

  if (['Kebabs', 'Burgers', 'Wraps'].includes(itemCategory)) {
    const sauceModifiers = adjusted.filter(m => m.groupId === 'sauce');

    const sauceSeparate = sauceModifiers.find(m => m.name === 'Sauce Separate');
    const sauceSeparateSelected = !!sauceSeparate;

    // Countable sauces
    const countableSauces = sauceModifiers.filter(
      m => m.name !== 'Sauce Separate' && m.name !== 'No Sauce'
    );

    countableSauces.forEach((m, index) => {
      if (sauceSeparateSelected && index >= 2) {
        m.price = 0.50;
      } else {
        m.price = 0;
      }
    });

    // Sauce Separate itself is always free
    if (sauceSeparate) {
      sauceSeparate.price = 0;
    }
  }

  return adjusted;
};

export const calculateChipsPrice = (itemName: string, modifiers: ModifierOption[], itemPrice: number = 0): number | null => {
  const isChips = itemName === 'Chips';
  const isMealDeal = itemName.toLowerCase().includes('meal deal');
  const isKidsMeal = itemName.toLowerCase().includes('kids meal');
  const hasMealUpgrade = modifiers.some(m => m.name === 'Meal');
  const hasChipsAddon = modifiers.some(m => m.name === 'And Chips');

  if (!isChips && !isMealDeal && !isKidsMeal && !hasMealUpgrade && !hasChipsAddon) return null;

  const sizeMod = modifiers.find(m => ['Small', 'Medium', 'Large', 'S', 'M', 'L'].includes(m.name));
  let size = 'Small';
  if (sizeMod) {
    if (sizeMod.name === 'S' || sizeMod.name === 'Small') size = 'Small';
    else if (sizeMod.name === 'M' || sizeMod.name === 'Medium') size = 'Medium';
    else if (sizeMod.name === 'L' || sizeMod.name === 'Large') size = 'Large';
  }

  const effectiveSize = (isMealDeal || isKidsMeal || hasMealUpgrade || hasChipsAddon) ? 'Small' : size;

  const curries = modifiers.filter(m => ['Mild Curry', 'Irish Curry', 'Fruit Curry', 'Gravy'].includes(m.name));
  const beansPeas = modifiers.filter(m => ['Beans', 'Mushy Peas'].includes(m.name));
  const cheeses = modifiers.filter(m => m.name === 'Cheese');

  const extraModifiers = modifiers.filter(m => 
    !['Small', 'Medium', 'Large', 'S', 'M', 'L', 'Mild Curry', 'Irish Curry', 'Fruit Curry', 'Gravy', 'Beans', 'Mushy Peas', 'Cheese'].includes(m.name)
  );

  const hasCurryOrGravy = curries.length > 0;
  const hasBeansOrPeas = beansPeas.length > 0;
  const hasCheese = cheeses.length > 0;

  let baseComboPrice = 0;

  if (effectiveSize === 'Small') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 5.50;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 4.10;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 4.90; // 2.70 + 2.20
    } else if (hasCheese) {
      baseComboPrice = 4.20; // 2.70 + 1.50
    } else {
      baseComboPrice = 2.70;
    }
  } else if (effectiveSize === 'Medium') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 5.70;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 4.50;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 5.70; // 3.50 + 2.20
    } else if (hasCheese) {
      baseComboPrice = 4.70;
    } else {
      baseComboPrice = 3.50;
    }
  } else if (effectiveSize === 'Large') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 6.70;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 5.50;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 6.40;
    } else if (hasCheese) {
      baseComboPrice = 5.70;
    } else {
      baseComboPrice = 4.20;
    }
  }

  let extraCost = extraModifiers.reduce((sum, m) => sum + m.price, 0);

  if (hasBeansOrPeas && hasCurryOrGravy) {
    extraCost += curries.length * 1.40;
    extraCost += (beansPeas.length - 1) * 2.20;
  } else if (hasBeansOrPeas) {
    extraCost += (beansPeas.length - 1) * 2.20;
  } else if (hasCurryOrGravy) {
    extraCost += (curries.length - 1) * 1.40;
  }

  if (hasCheese) {
    extraCost += (cheeses.length - 1) * 1.50;
  }

  if (isChips) {
    return baseComboPrice + extraCost;
  } else {
    // For meals, the base price of the item already includes the chips.
    // So we just add the extra cost of the chips_sauce modifiers.
    // The extra cost is the combo price minus the base price of the chips.
    const chipsBasePrice = effectiveSize === 'Small' ? 2.70 : effectiveSize === 'Medium' ? 3.50 : 4.20;
    const chipsExtraCost = baseComboPrice - chipsBasePrice;
    return itemPrice + chipsExtraCost + extraCost;
  }
};

export const getModifierSuperGroup = (groupId?: string) => {
  if (!groupId) return 'misc';
  const id = groupId.toLowerCase();
  
  // 1. Type / Base / Flavor
  if (
    id.includes('flavor') ||
    id === 'kids_sausage_type' ||
    id === 'sausage_type' ||
    id === 'kids_meal_type' ||
    id === 'chicken_curry_style' ||
    id === 'kebab_burger_meat'
  ) return 'type';

  // 1.5 Served With
  if (id === 'kebab_base') return 'served_with';

  // 2. Size
  if (
    id.includes('size') || 
    id === 'cod_bites_size'
  ) return 'size';

  // 3. Upgrade
  if (
    id === 'meal_upgrade' ||
    id === 'wrap_meal_upgrade'
  ) return 'upgrade';

  // 4. Add Chips
  if (
    id.includes('chip_opt') ||
    id.includes('chips_opt') ||
    id.includes('opt_chips') ||
    id.includes('add_chips') ||
    id === 'chips_cod_bites' ||
    id === 'chips_fish_cake' ||
    id === 'chicken_breast_chips'
  ) return 'add_chips';

  // 5. Drink
  if (
    id === 'meal_drinks' ||
    id === 'kids_drink_select' ||
    id === 'all_drinks_opt' ||
    id.includes('drink')
  ) return 'drink';

  // 6. Salad
  if (id === 'salad') return 'salad';

  // 7. Sauce (Basic)
  if (
    id === 'sauce' || 
    id === 'kids_sauce_choice' || 
    id === 'sauce_pot_type' || 
    id === 'dip_flavours'
  ) return 'sauce_basic';

  // 8. Condiments
  if (id === 'condiments') return 'condiments';

  // 9. Sauce & Toppings
  if (id === 'chips_sauce') return 'sauce_toppings';

  // 10. Addons
  if (id === 'chips_addons' || id === 'pie_addons') return 'addons';
  
  return id;
};

export const isInlineModifier = (groupId?: string, itemName?: string) => {
  if (!groupId) return true;
  const id = groupId.toLowerCase();
  
  const superGroup = getModifierSuperGroup(groupId);

  const NEW_LINE_GROUPS = [
    'salad', 
    'sauce', 
    'condiments', 
    'pie_addons', 
    'chips_sauce', 
    'chips_addons',
    'meal_upgrade',
    'wrap_meal_upgrade',
    'meal_drinks',
    'kebab_base',
    'kebab_burger_meat',
    'side_add_chips',
    'chicken_curry_style'
  ];
  
  return !NEW_LINE_GROUPS.includes(id);
};

export const getModifierPriority = (groupId?: string) => {
  if (!groupId) return 999;
  const superGroup = getModifierSuperGroup(groupId);
  
  switch (superGroup) {
    case 'type': return 5;
    case 'size': return 10;
    case 'served_with': return 15;
    case 'upgrade': return 30;
    case 'add_chips': return 40;
    case 'salad': return 60;
    case 'sauce_basic': return 70;
    case 'condiments': return 72;
    case 'drink': return 74;
    case 'sauce_toppings': return 76;
    case 'addons': return 90;
    default: return 999;
  }
};
