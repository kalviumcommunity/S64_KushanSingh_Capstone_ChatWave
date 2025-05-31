import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const EmojiPicker = ({ onSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <Picker
        data={data}
        onEmojiSelect={onSelect}
        theme="light"
        showPreview={false}
        showSkinTones={false}
        emojiSize={20}
        perLine={8}
        maxFrequentRows={1}
      />
    </div>
  );
};

export default EmojiPicker; 