import { useState } from "react";
import CardFlip from "react-card-flip";

const Flashcard = ({ question, answer }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="max-w-lg w-full p-4">
      <CardFlip isFlipped={isFlipped} flipDirection="horizontal">
        <div
          className="card-side bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-xl p-6 h-64 flex items-center justify-center cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={handleClick}
        >
          <h2 className="text-2xl font-bold text-center">{question}</h2>
        </div>
        <div
          className="card-side bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-xl p-6 h-64 flex items-center justify-center cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={handleClick}
        >
          <p className="text-xl text-center">{answer}</p>
        </div>
      </CardFlip>
    </div>
  );
};

export default Flashcard;
