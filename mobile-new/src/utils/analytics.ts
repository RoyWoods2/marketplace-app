interface Order {
  id: string;
  total: number;
  quantity: number;
  status: string;
  createdAt: string;
  product?: {
    id: string;
    title: string;
    category: string;
    price: number;
  };
}

interface Insight {
  type: 'success' | 'info' | 'warning' | 'trend';
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

/**
 * Analiza las órdenes y genera insights inteligentes
 */
export function generateInsights(orders: Order[], timeframe: 'week' | 'month' | 'year'): Insight[] {
  const insights: Insight[] = [];
  
  if (orders.length === 0) {
    return [{
      type: 'info',
      icon: '📊',
      title: 'Sin datos aún',
      description: 'Aún no tienes suficientes ventas para generar análisis. ¡Comienza a vender!',
    }];
  }

  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  
  // 1. Día con más ventas
  const daySales: { [key: string]: number } = {};
  deliveredOrders.forEach(order => {
    const date = new Date(order.createdAt);
    const dayKey = date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
    daySales[dayKey] = (daySales[dayKey] || 0) + 1;
  });

  if (Object.keys(daySales).length > 0) {
    const dayEntries = Object.entries(daySales);
    if (dayEntries.length > 0) {
      const bestDay = dayEntries.reduce((a, b) => 
        daySales[a[0]] > daySales[b[0]] ? a : b
      );

      if (bestDay && bestDay.length >= 2 && bestDay[1] > 0) {
        insights.push({
          type: 'success',
          icon: '📅',
          title: 'Mejor día de ventas',
          description: `El ${bestDay[0]} fue tu día más productivo con ${bestDay[1]} venta${bestDay[1] > 1 ? 's' : ''}.`,
          highlight: `${bestDay[1]} ventas`,
        });
      }
    }
  }

  // 2. Producto más vendido
  const productSales: { [key: string]: { count: number; revenue: number; name: string } } = {};
  deliveredOrders.forEach(order => {
    if (order.product && order.product.id) {
      const productId = order.product.id;
      if (!productSales[productId]) {
        productSales[productId] = { count: 0, revenue: 0, name: order.product.title || 'Producto sin nombre' };
      }
      productSales[productId].count += order.quantity || 1;
      productSales[productId].revenue += order.total || 0;
    }
  });

  if (Object.keys(productSales).length > 0) {
    const productEntries = Object.entries(productSales);
    if (productEntries.length > 0) {
      const topProduct = productEntries.reduce((a, b) => 
        productSales[a[0]].count > productSales[b[0]].count ? a : b
      );

      if (topProduct && topProduct.length >= 2 && topProduct[1] && topProduct[1].count > 0) {
        insights.push({
          type: 'success',
          icon: '🏆',
          title: 'Producto estrella',
          description: `${topProduct[1].name} es tu producto más vendido con ${topProduct[1].count} unidad${topProduct[1].count > 1 ? 'es' : ''} vendida${topProduct[1].count > 1 ? 's' : ''}.`,
          highlight: `${topProduct[1].count} unidades`,
        });
      }
    }
  }

  // 3. Tendencia de ingresos
  const sortedOrders = [...deliveredOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  if (sortedOrders.length >= 2) {
    const firstHalf = sortedOrders.slice(0, Math.floor(sortedOrders.length / 2));
    const secondHalf = sortedOrders.slice(Math.floor(sortedOrders.length / 2));

    const firstHalfRevenue = firstHalf.reduce((sum, o) => sum + o.total, 0);
    const secondHalfRevenue = secondHalf.reduce((sum, o) => sum + o.total, 0);

    const change = ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100;

    if (Math.abs(change) > 10) {
      insights.push({
        type: change > 0 ? 'trend' : 'warning',
        icon: change > 0 ? '📈' : '📉',
        title: change > 0 ? 'Tendencia al alza' : 'Tendencia a la baja',
        description: change > 0
          ? `Tus ingresos han aumentado un ${Math.abs(change).toFixed(0)}% en la segunda mitad del período. ¡Sigue así!`
          : `Tus ingresos han disminuido un ${Math.abs(change).toFixed(0)}% en la segunda mitad del período. Considera promociones.`,
        highlight: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      });
    }
  }

  // 4. Día de la semana más productivo
  const weekdaySales: { [key: string]: number } = {};
  deliveredOrders.forEach(order => {
    const date = new Date(order.createdAt);
    const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
    weekdaySales[weekday] = (weekdaySales[weekday] || 0) + 1;
  });

  if (Object.keys(weekdaySales).length > 1) {
    const weekdayEntries = Object.entries(weekdaySales);
    if (weekdayEntries.length > 0) {
      const bestWeekday = weekdayEntries.reduce((a, b) => 
        weekdaySales[a[0]] > weekdaySales[b[0]] ? a : b
      );

      if (bestWeekday && bestWeekday.length >= 2 && bestWeekday[1] > 0) {
        insights.push({
          type: 'info',
          icon: '📆',
          title: 'Día de la semana favorito',
          description: `Los ${bestWeekday[0]} son tus días más productivos. Planifica promociones especiales para maximizar ventas.`,
          highlight: bestWeekday[0],
        });
      }
    }
  }

  // 5. Productos por categoría
  const categorySales: { [key: string]: number } = {};
  deliveredOrders.forEach(order => {
    if (order.product?.category) {
      const quantity = order.quantity || 1;
      categorySales[order.product.category] = (categorySales[order.product.category] || 0) + quantity;
    }
  });

  if (Object.keys(categorySales).length > 1) {
    const categoryEntries = Object.entries(categorySales);
    if (categoryEntries.length > 0) {
      const topCategory = categoryEntries.reduce((a, b) => 
        categorySales[a[0]] > categorySales[b[0]] ? a : b
      );

      if (topCategory && topCategory.length >= 2 && topCategory[1] > 0) {
        insights.push({
          type: 'info',
          icon: '🏷️',
          title: 'Categoría destacada',
          description: `La categoría "${topCategory[0]}" es tu mejor área con ${topCategory[1]} producto${topCategory[1] > 1 ? 's' : ''} vendido${topCategory[1] > 1 ? 's' : ''}. Considera expandir esta línea.`,
          highlight: topCategory[0],
        });
      }
    }
  }

  // 6. Recomendación estacional (si tenemos datos suficientes)
  const currentMonth = new Date().getMonth();
  const isSummer = currentMonth >= 11 || currentMonth <= 2; // Dic, Ene, Feb (verano en Chile)
  const isWinter = currentMonth >= 5 && currentMonth <= 8; // Jun, Jul, Ago (invierno en Chile)

  if (deliveredOrders.length >= 10) {
    insights.push({
      type: 'trend',
      icon: isSummer ? '☀️' : isWinter ? '❄️' : '🌤️',
      title: isSummer ? 'Temporada de verano' : isWinter ? 'Temporada de invierno' : 'Temporada actual',
      description: isSummer
        ? 'Estamos en verano. Los productos de temporada suelen tener mejor rendimiento. Considera promociones especiales.'
        : isWinter
        ? 'Estamos en invierno. Los clientes buscan productos de temporada. Aprovecha esta oportunidad.'
        : 'Analiza las tendencias de temporada para optimizar tu inventario.',
    });
  }

  // 7. Promedio de venta
  const avgOrderValue = deliveredOrders.length > 0
    ? deliveredOrders.reduce((sum, o) => sum + o.total, 0) / deliveredOrders.length
    : 0;

  if (avgOrderValue > 0) {
    insights.push({
      type: 'info',
      icon: '💰',
      title: 'Ticket promedio',
      description: `Tu ticket promedio es de $${Math.round(avgOrderValue).toLocaleString('es-CL')} CLP. Considera ofrecer paquetes para aumentar este valor.`,
      highlight: `$${Math.round(avgOrderValue).toLocaleString('es-CL')} CLP`,
    });
  }

  return insights;
}

