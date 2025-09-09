# Developer Toolkit

A modern web application for developers to compare, format, and visualize JSON data, decode JWTs, and edit markdown. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **JSON Diff Checker:** Compare two JSON files and highlight differences.
- **JSON Formatter & Viewer:** Beautify, validate, and view JSON data with syntax highlighting.
- **File Upload:** Easily upload JSON files for comparison or viewing.
- **JWT Decoder:** Decode and inspect JWT tokens.
- **Markdown Editor:** Edit and preview markdown content.
- **Undo/Redo:** Convenient undo/redo functionality for editing JSON and markdown.
- **Theme Support:** Light and dark mode toggle.

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Project Structure

```
src/
	components/        # Reusable React components
	contexts/          # React context providers
	hooks/             # Custom React hooks
	utils/             # Utility functions
	__tests__/         # Unit and integration tests
	test/              # Test setup files
```

## Technologies Used

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Jest](https://jestjs.io/) & [React Testing Library](https://testing-library.com/)

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

Maintained by SRIDAR10.
