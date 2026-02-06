# Using Pandoc with Office Seat Planner

The recommended way to generate a PDF is using the **"In PDF (Vector)"** button in the app, which uses the browser's built-in high-fidelity print engine.

However, if you wish to use Pandoc to process the output, you can follow these steps:

1.  **Export HTML**:
    - Right-click the page > "Save As..." > "Webpage, Complete".
    - Save it as `seat-plan.html`.

2.  **Run Pandoc** (Requires Pandoc installed):
    ```bash
    pandoc seat-plan.html -t html5 -o seat-plan.pdf --css=style.css
    ```
    *Note: You may need to ensure CSS is properly referenced or embedded.*

**Why Native Print is Better for this App:**
This application uses React and Tailwind CSS. Pandoc is primarily for static documents (Markdown, Word). Converting a dynamic JS application to PDF via Pandoc requires a "Headless Browser" (like Puppeteer) anyway. The **"In PDF"** button basically triggers that headless browser engine directly within your current browser, ensuring:
-   **Exact Layout**: What you see is what you get.
-   **Vector Quality**: Text remains sharp (not an image).
-   **Zero Setup**: No need to install Pandoc or LaTeX.
