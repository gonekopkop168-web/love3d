# MangaKH
បើក `index.html` ដោយផ្ទាល់ ឬ run: `python3 -m http.server 8000` រួចបើក http://localhost:8000

## បន្ថែមជំពូកថ្មី
1. ដាក់រូបភាពក្នុង `images/<folder>/01.webp, 02.webp ...`
2. កែ `js/data.js` ដោយបន្ថែមក្នុង `chapters: [...]`:
   `{ n: 2, title: 'ចំណងជើង', date: '2026-11-20', pages: pages('folder', 18) }`

## មុខងារ
- រមូរបញ្ឈរ (webtoon) និងមើលម្តងមួយទំព័រ
- ចងចាំទំព័រដែលបានអាន, ងងឹត/ភ្លឺ, ពង្រីកទទឹង, Fullscreen
- ក្តារចុច: ← → (ទំព័រ), F (Fullscreen)
