# LinkedIn Content Engine (MERN + Groq + SD3.5)

Scaffolded full-stack app for generating LinkedIn posts via RAG (MongoDB Atlas Vector Search + Groq) and generating images via Stability AI SD3.5.

## Project Structure

- `backend/` Express API + AI services
- `frontend/` React + Tailwind dashboard

## Backend Highlights

Main AI service file: `backend/src/services/aiService.js`

Implemented functions:

1. `generateTextWithRAG(userTopic)`
   - Embeds topic
   - Runs MongoDB Atlas `$vectorSearch` on `post_templates`
   - Injects retrieved templates into Groq prompt
   - Generates LinkedIn post using `llama-3.3-70b-versatile`
2. `generateImagePrompt(postContent)`
   - Uses Groq to convert post into a high-quality SD prompt
3. `generateSDImage(imagePrompt)`
   - Calls Stability AI `/v2beta/stable-image/generate/sd3`
   - Returns image buffer and base64 preview

Additional:
- `refineLinkedInPost(postContent, style)` for "Refine" button.
- Image history persistence in MongoDB `image_history`.
- Optional Cloudinary upload for durable image URLs (falls back to base64 in MongoDB when Cloudinary is not configured).

## API Endpoints

- `POST /api/ai/generate` -> `{ topic }`
- `POST /api/ai/refine` -> `{ postContent, style }`
- `POST /api/ai/image-prompt` -> `{ postContent }`
- `POST /api/ai/image` -> `{ topic, postContent, imagePrompt }`
- `GET /api/ai/image-history?limit=12`

## Setup

1. Copy `.env.example` values into `.env` in project root.
2. Install backend dependencies:

```bash
cd backend
npm install
npm run dev
```

3. Install frontend dependencies:

```bash
cd frontend
npm install
npm run dev
```

4. Open frontend at `http://localhost:5173`.

## MongoDB Atlas Requirements

- Create collection `post_templates`.
- Add vector field `embedding` as array of numbers.
- Create Atlas vector index named `post_templates_vector_idx` (or set via env).

Suggested `post_templates` document shape:

```json
{
  "hook": "Most teams confuse activity with outcomes.",
  "structure": "Hook -> Story -> Framework -> CTA",
  "example": "We shipped 12 features but churn still rose...",
  "embedding": [0.01, -0.02, 0.12]
}
```
