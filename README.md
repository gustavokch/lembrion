# Lembrion 🎓

**AI study sessions built on learning science, using the AI provider you choose**

Lembrion turns a list of study topics into a quiz session. An AI model writes multiple-choice or open-ended questions, evaluates your written answers, and keeps a history of every session. The approach is inspired by *Make It Stick: The Science of Successful Learning*.

Lembrion is a client-only web app: there is no backend and no account. Your browser calls the AI provider directly with your own API key.

Lembrion is based on [Studorama](https://github.com/oluiscabral/studorama) by oluiscabral (MIT).

🌐 **Live at: [lembrion.vercel.app](https://lembrion.vercel.app)**

![Lembrion Banner](https://github.com/user-attachments/assets/9c74ca79-9f32-467d-a264-9641d405da02)

## ✨ Features

### 📚 Study sessions
- **Multiple-choice questions** with four options and an explanation, graded in the browser.
- **Dissertative (open-ended) questions**, evaluated by the AI model with written feedback and a 0-100 score; 70 or more counts as correct.
- **Mixed mode**: each new question is randomly multiple-choice or dissertative.
- **Study contexts and instructions**: list the topics to cover and optional instructions (a textbook, an author, a focus area) for the question generator.
- **Difficulty**: pick easy, medium, or hard when you start a session.
- **Confidence rating** recorded with each answer.

### 🧠 Learning techniques
Each session stores five toggles. They are on by default and can be changed when the session starts or later from the history page.
- **Spaced repetition**: a missed question, or a correct one answered with confidence 2 or less, comes back with its options reshuffled after 3 new questions, up to 2 times. It also enters a review queue across sessions: the Dashboard's Review card starts a review session of up to 20 due questions, and each answer moves the question between Leitner boxes due after 1, 3, 7, 14 and 30 days (a confident correct answer moves it up, a miss sends it back to the first box, and passing the last box retires it).
- **Interleaving**: with 2 or more contexts, each new question focuses on the next context in turn.
- **Elaborative interrogation**: a wrong answer triggers a follow-up "why" question; your answer is saved.
- **Self-explanation**: after a correct answer (or any answer when elaborative interrogation is off), you explain in your own words why the correct answer is right; the text is saved. "Get feedback" asks the AI what your explanation gets right and what it misses; the feedback is saved with it and does not change your score.
- **Desirable difficulties**: the difficulty goes up after 3 correct answers in a row at the current level and down after 2 misses in a row.

### 📊 History
- Dashboard with session counts and recent sessions.
- Session history with search and a status filter (active / completed).
- Per-session detail view with every question, your answer, the feedback, the difficulty, the dissertative score, review copies, and your elaborative and self-explanation answers with the explanation feedback. Review sessions carry a "Review" label.
- Edit a session's contexts, instructions, difficulty, and learning settings.

### 🤖 AI providers
| Provider | API key | Notes |
|----------|---------|-------|
| **OpenAI** | Required | |
| **Google Gemini** | Required | The key is sent in the `x-goog-api-key` request header |
| **Anthropic** | Required | |
| **DeepSeek** | Required | |
| **Ollama** | Not needed | Runs models on your own machine; default base URL `http://localhost:11434/v1` |

- **Model ids are free-form**: Settings suggests known models for each provider, but you can enter any model id the provider accepts.
- Each provider keeps its own API key, model, and (where supported) base URL.

### 🎨 Interface
- English and Portuguese (Brazil). Prompts are written per language, so questions come back in the selected language.
- Three themes: light, dark, and high contrast. Every theme meets WCAG AA text contrast.
- Responsive layout for phones, tablets, and desktops.
- Questions and feedback are rendered as Markdown with code highlighting; LaTeX-style math is converted to readable text.

## 🔒 Privacy and costs

- **Stored in your browser**: API keys, provider settings, preferences, and study sessions live in `localStorage`. Lembrion has no server, no account system, and no analytics.
- **Sent to your AI provider**: to generate and evaluate questions, your browser sends your study topics, instructions, answers, and API key to the provider you selected. The provider processes them under its own terms. With a local Ollama server, requests stay on your machine.
- **API keys in URLs**: you can pre-configure a provider with URL parameters (see below). A key in a URL can end up in browser history, bookmarks, or shared links, so treat such links as secrets. The app removes the parameters from the address bar after reading them.
- **Costs**: Lembrion is free and open source. Cloud providers bill API usage to your key. Ollama has no API cost.
- **Delete everything**: Settings → Data removes all Lembrion data from the browser.

## 🌟 Getting started

### Use the hosted app
1. Open [lembrion.vercel.app](https://lembrion.vercel.app).
2. In **Settings**, pick a provider, paste your API key (not needed for Ollama), and enter or pick a model id.
3. Choose your language.
4. Go to **Study**, enter one or more topics, choose the question type, and start.

### Configure a provider from the URL
```
https://lembrion.vercel.app/?provider=openai&apikey=sk-...&model=gpt-4o-mini
```
Supported parameters: `provider`, `apikey` (or `api_key`, `key`), `model`, `baseUrl` (or `base_url`). Without `provider`, the app guesses it from the key format (`sk-ant-` → Anthropic, `sk-` → OpenAI, `AIza` → Gemini). DeepSeek keys also start with `sk-`, so pass `provider=deepseek` for them.

### Get an API key
- **OpenAI**: platform.openai.com → API keys
- **Google Gemini**: aistudio.google.com → Get API key
- **Anthropic**: console.anthropic.com → API keys
- **DeepSeek**: platform.deepseek.com → API keys

### Ollama (local)
```bash
# Install Ollama (see https://ollama.com for other platforms)
curl -fsSL https://ollama.com/install.sh | sh

# Allow the Lembrion origin to call the local server, then start it
OLLAMA_ORIGINS="https://lembrion.vercel.app" ollama serve

# Pull a model, then enter its id (e.g. llama3.1:8b) in Lembrion's settings
ollama pull llama3.1:8b
```
Browsers block cross-origin requests to Ollama unless `OLLAMA_ORIGINS` includes the page's origin (use `http://localhost:5173` for the dev server).

## 🛠️ Development

Requires Node.js 18.18 or later and npm.

```bash
git clone https://github.com/gustavokch/lembrion.git
cd lembrion
npm install

npm run dev         # Vite dev server on http://localhost:5173
npm run typecheck   # tsc -b
npm run test        # Vitest (jsdom)
npm run lint        # ESLint
npm run build       # tsc -b, then vite build into dist/
npm run preview     # serve dist/ on http://localhost:4173
```

The service worker registers only in production builds served from a non-localhost host. The dev server and local previews unregister any leftover worker.

### Technology
- React 18 + TypeScript, built with Vite 5
- Tailwind CSS 3 with semantic colour tokens (CSS variables written by the theme hook)
- Fira Sans and Fira Mono, self-hosted through Fontsource
- React Router 6
- State in React hooks persisted to `localStorage` (no state library)
- AI providers called with `fetch`; no SDKs, no streaming
- Custom i18n (en-US, pt-BR)

### Releases
```bash
npm run version:info     # print the current version (read-only)
npm run version:patch    # bump the version in package.json, index.html and public/sw.js
npm run deploy           # release a patch: checks, bump, commit, tag, push
```
`npm run deploy` (or `deploy:minor` / `deploy:major`) runs only on `main`. It stops on a dirty tree unless you confirm in a terminal, runs lint, typecheck and build before it bumps the version, commits only the three version files, creates an annotated `v<version>` tag, and pushes `main` and the tag to `origin`. The hosted app deploys from `main`.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-change`).
3. Run `npm run typecheck`, `npm run lint`, and `npm run test`.
4. Commit and open a pull request.

Useful areas: new AI providers, translations, making the stored learning-technique toggles affect sessions, accessibility, and tests.

## 📄 License

MIT. See [LICENSE](LICENSE).

## 🙏 Acknowledgments

- **Peter C. Brown, Henry L. Roediger III, Mark A. McDaniel**, authors of *Make It Stick*
- **Lucide** for the icon set
- **React** and **Tailwind CSS**

## 📞 Support

- **Issues**: [github.com/gustavokch/lembrion/issues](https://github.com/gustavokch/lembrion/issues)
- **Sponsor**: the in-app **Support** page lists the ways to support the project.
