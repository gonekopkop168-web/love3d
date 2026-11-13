// បន្ថែមមង់ហ្គា/ជំពូកថ្មីនៅទីនេះ — add new manga/chapters here
const pad = n => String(n).padStart(2, '0');
const pages = (folder, count) => Array.from({ length: count }, (_, i) => `images/${folder}/${pad(i + 1)}.webp`);

window.MANGA = [
  {
    id: 'kitchen-love',
    title: 'ស្នេហ៍ក្នុងផ្ទះបាយ',
    author: 'MangaKH',
    genre: ['រ៉ូម៉ង់ទិក', 'កំប្លែង', 'ជីវិតប្រចាំថ្ងៃ'],
    status: 'កំពុងបន្ត',
    rating: 4.8,
    desc: 'រឿងរ៉ាវផ្អែមល្ហែមរបស់គូស្នេហ៍មួយគូ ដែលចំណាយពេលជាមួយគ្នាក្នុងផ្ទះបាយ ពោរពេញដោយសំណើច និងភាពកក់ក្តៅ។',
    cover: 'images/cover.webp',
    chapters: [
      { n: 1, title: 'ធ្វើនំជាមួយគ្នា', date: '2026-11-13', pages: pages('pages', 20) }
    ]
  }
];
