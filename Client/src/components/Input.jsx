import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { Input as TextInput } from "@/components/ui/input";
import FlashcardGrid from "@/components/FlashcardGrid";

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;

const FlashcardInput = ({
  quiz,
  handleMessageChange,
  submitHandler,
  error,
  setFlashcards,
  loading: parentLoading,
  setLoading: setParentLoading,
}) => {
  const [image, setImage] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [errorMessage, setError] = useState(null);
  const [imageUploaded, setImageUploaded] = useState(false);
  const COLORS_TOP = ["#00BFFF", "#1E90FF"];
  const color = useMotionValue(COLORS_TOP[0]);
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > IMAGE_MAX_SIZE) {
        setError("Image size cannot exceed 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setImageUploaded(true);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (image) {
      await generateFlashcards();
    } else {
      submitHandler(event);
    }
  };

  const generateFlashcards = async () => {
    const isLoading = parentLoading !== undefined ? setParentLoading : setLocalLoading;
    isLoading(true);
    setError(null);
    try {
      if (!image) {
        throw new Error(
          "No image uploaded. Please upload an image to generate flashcards."
        );
      }
      const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080/generate";

      // Post the base64 image to the backend; it will generate flashcards
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: image, quiz: quiz || "" })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.details || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response from server.');
      }
      
      const formattedFlashcards = data.map((item) => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
      }));
      
      if (setFlashcards) {
        setFlashcards(formattedFlashcards);
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setError(`Failed to generate flashcards: ${error.message}`);
    } finally {
      isLoading(false);
    }
  };


  return (
    <>
      <div
        id="message-form"
        className="mx-auto w-full box-border max-w-[850px] text-center"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full mx-auto flex flex-col gap-10"
        >
          <div className="flex flex-col gap-3">
            <div className="flex bg-gray-800 border border-gray-700 rounded-full overflow-hidden">
              <div className="w-[80%]">
                <TextInput
                  id="message"
                  rows="1"
                  value={quiz}
                  required={!image}
                  onChange={handleMessageChange}
                  placeholder="Generate flashcards about ancient Egyptian civilization?"
                  className="w-full h-full bg-transparent text-white placeholder:text-xs placeholder-gray-300 placeholder:lg:text-lg placeholder:sm:text-sm placeholder:md:text-base border-none focus:ring-0 rounded-none py-3 px-4 text-sm lg:text-lg md:text-base sm:text-sm focus:outline-none"
                />
              </div>
              <div className="w-[20%] border-l border-gray-700 relative">
                <div className="h-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="inset-0 h-full opacity-0 cursor-pointer w-full z-20"
                    id="image-upload"
                  />
                  <div
                    className="flex items-center justify-center transition-colors z-10 absolute top-0 left-0 w-full h-full cursor-pointer"
                    onClick={() =>
                      document.getElementById("image-upload").click()
                    }
                  >
                    <ImageIcon
                      className={`w-6 h-6 ${
                        imageUploaded ? "text-green-500" : "text-white"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              <p>
                Please keep your prompt concise. Longer prompts may lead to
                errors, and model accuracy is not guaranteed.
              </p>
            </div>
          </div>
          <motion.button
            style={{ border, boxShadow }}
            whileHover={{ scale: 1.045 }}
            whileTap={{ scale: 0.985 }}
            className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-4 py-2 text-gray-50 transition-colors hover:bg-gray-950/50 self-center"
            disabled={parentLoading || localLoading}
          >
            {(parentLoading || localLoading) ? "Generating..." : "Generate"}
          </motion.button>
        </form>
        <div className="flex flex-col gap-2 pt-5">
          {error && <div className="text-red-500">{error}</div>}
          {errorMessage && (
            <div className="text-red-500 text-center">{errorMessage}</div>
          )}
        </div>
      </div>
    </>
  );
};

FlashcardInput.propTypes = {
  quiz: PropTypes.string.isRequired,
  handleMessageChange: PropTypes.func.isRequired,
  submitHandler: PropTypes.func.isRequired,
  error: PropTypes.string,
  setFlashcards: PropTypes.func,
  loading: PropTypes.bool,
  setLoading: PropTypes.func,
};

export default FlashcardInput;
