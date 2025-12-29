import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { visit } from 'unist-util-visit';

function obsidianImageFix() {
  return function (tree, file) {
    const filepath = file.history[0];
    const filename = filepath.split('/').pop().replace('.md', '');
    visit(tree, 'text', (node, index, parent) => {
      const regex = /!\[\[(.*?)\]\]/g;
      if (regex.test(node.value)) {
        const matches = [...node.value.matchAll(regex)];      
        const newNodes = matches.map(match => {
           const imageName = match[1];
           return {
             type: 'image',
             url: `/images/${filename}/${imageName}`,
             alt: imageName
           };
        });    
        if(parent && typeof index === 'number') {
           parent.children.splice(index, 1, ...newNodes);
        }
      }
    });
  };
}
export default defineConfig({
  site: 'https://0xr0k.github.io', // Tu URL real
  base: '/',
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [obsidianImageFix], // Activamos nuestro plugin
    shikiConfig: {
      theme: 'dracula', // Tema de código estilo Cyberpunk
    },
  },
});
