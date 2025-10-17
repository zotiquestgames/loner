/**
 * Central registry of all available table supplements
 * Add new supplements here as they're published
 */

const TableRegistry = {
  supplements: [
    {
      id: 'core-loner',
      name: 'Loner Core Rules',
      file: 'data/tables/core-loner.js',
      version: '2.0',
      enabled: true
    },
    {
      id: 'core-inspired',
      name: 'Core Get Inspired',
      file: 'data/tables/core-inspired.js',
      version: '2.0',
      enabled: true,
      flavorOf: 'get-inspired'
    },
    // Future supplements:
    // {
    //   id: 'space-opera',
    //   name: 'Space Opera Supplement',
    //   file: 'data/tables/supplements/space-opera.js',
    //   version: '1.0',
    //   enabled: true,
    //   flavorOf: 'get-inspired'
    // }
  ],
  
  /**
   * Load all enabled supplements
   */
  async loadAll() {
    const promises = this.supplements
      .filter(s => s.enabled)
      .map(s => this.loadSupplement(s));
    
    return await Promise.all(promises);
  },
  
  /**
   * Load a single supplement
   */
  async loadSupplement(supplement) {
    // In production, dynamically import the file
    // For now, assumes they're already loaded globally
    return supplement;
  }
};