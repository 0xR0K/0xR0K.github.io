import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

// --- INICIO DEL PARCHE ---
function obsidianImageFix() {
  return function (tree, file) {
    // 1. Obtenemos la ruta del archivo actual
    const filepath = file.history[0];
    if (!filepath) return;
    
    // 2. Calculamos el nombre de la carpeta (ej: FileSystems.md -> filesystems)
    const filename = filepath.split('/').pop().replace('.md', '').toLowerCase();
    
    visit(tree, 'text', (node, index, parent) => {
      const regex = /!\[\[(.*?)\]\]/g;
      
      // Si no hay formato Obsidian, pasamos al siguiente
      if (!regex.test(node.value)) return;
      
      const nodes = [];
      let lastIndex = 0;
      let match;
      
      regex.lastIndex = 0;
      while ((match = regex.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          nodes.push({
            type: 'text',
            value: node.value.slice(lastIndex, match.index)
          });
        }
        
        const imageName = match[1];
        nodes.push({
          type: 'image',
          url: `/images/${filename}/${encodeURI(imageName)}`, 
          alt: imageName
        });
        
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < node.value.length) {
        nodes.push({
          type: 'text',
          value: node.value.slice(lastIndex)
        });
      }
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, ...nodes);
        return index + nodes.length; // Ajustamos el índice para seguir leyendo
      }
    });
  };
}
// --- FIN DEL PARCHE ---

export default defineConfig({
  site: 'https://0xr0k.github.io',
  base: '/',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [obsidianImageFix],
    shikiConfig: {
      theme: 'dracula',
    },
  },
});
