import axios from "axios";
import React, { useState } from "react";
import { saveAs } from "file-saver";
import { Document, Packer, Paragraph, TextRun, BorderStyle } from "docx";
import "../css/Home.css";

export const Home = () => {
  const [formData, setFormData] = useState({
    language: "",
    topic: "",
  });
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log(formData);
      const res = await axios.post("/api/data", formData);
      console.log(res.data);
      setApiResponse(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    setFormData({ ...formData, language: e.target.value });
  };

  const handleTopicChange = (e) => {
    setFormData({ ...formData, topic: e.target.value });
  };

  const generateHTMLContent = () => {
    if (!apiResponse) {
      return "<p>No content available</p>";
    }

    const { title, topics } = apiResponse;

    if (!title || !topics) {
      console.error("Invalid response format:", apiResponse);
      return "<p>Error: Unable to generate content.</p>";
    }

    const htmlContent = `
      <h1>${title}</h1>
      ${topics
        .map(
          (section) => `
            <h2>${section.name || "Untitled Section"}</h2>
            <ul>
              ${section.points.map((point) => `<li>${point}</li>`).join("")}
            </ul>
            ${section.code ? `<pre><code>${section.code}</code></pre>` : ""}
          `
        )
        .join("")}
    `;
    return htmlContent;
  };

  const handleDownload = () => {
    if (!apiResponse) {
      alert("No content available to download!");
      return;
    }

    const { title, topics } = apiResponse;

    const doc = new Document({
      sections: [
        {
          children: [
            // Document Title
            new Paragraph({
              text: title,
              heading: "Heading1",
              spacing: { after: 300 }, // Add spacing after the title (300 is the spacing in half-points)
            }),

            // Simulate Horizontal Rule (Thin Border)
            new Paragraph({
              children: [
                new TextRun({
                  text: " ",
                  font: "Arial",
                  size: 1, // Small size to simulate a thin line
                }),
              ],
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 2, // Set the thickness of the line
                  space: 1,
                },
              },
            }),

            ...topics.flatMap((section) => [
              // Section Heading
              new Paragraph({
                text: section.name || "Untitled Section",
                heading: "Heading2",
                spacing: { after: 300 }, // Add spacing after section heading
              }),

              // Points under Section
              ...section.points.map(
                (point) =>
                  new Paragraph({
                    text: point,
                    bullet: {
                      level: 0,
                    },
                    spacing: { after: 200 }, // Add spacing after each point (200 is the spacing in half-points)
                  })
              ),

              // Code Block
              section.code
                ? new Paragraph({
                    children: [
                      new TextRun({
                        text: section.code,
                        font: "Courier New",
                        color: "444444",
                      }),
                    ],
                    spacing: { after: 400 }, // Add spacing after code block (400 is the spacing in half-points)
                  })
                : null,
            ]),
          ].filter(Boolean),
        },
      ],
    });
    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, `${title.replace(/\s+/g, "_")}.docx`);
    });
  };

  return (
    <div className="container">
      <div className="row">
        <h1>Notes Generator</h1>
        <div className="col-lg-6">
          <form>
            <label htmlFor="Language">Language: </label>
            <input
              type="text"
              onChange={handleLanguageChange}
              value={formData.language}
            />
            <br />
            <label htmlFor="Topic">Topic: </label>
            <input
              type="text"
              onChange={handleTopicChange}
              value={formData.topic}
            />
          </form>
          <button
            className={`my-1 me-1 btn ${
              loading ? "btn-secondary" : "btn-primary"
            }`}
            type="submit"
            disabled={loading}
            onClick={handleFormSubmit}
          >
            {loading ? "Generating..." : "Generate Notes"}
          </button>
          {apiResponse ? (
            <button
              className="m-1 btn btn-primary"
              type="button"
              onClick={handleDownload}
            >
              Download as Word Document
            </button>
          ) : null}
        </div>
        <div className="col-lg-6">
          <div className="preview-container">
            <div className="word-document">
              <div
                className="content"
                dangerouslySetInnerHTML={{ __html: generateHTMLContent() }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
