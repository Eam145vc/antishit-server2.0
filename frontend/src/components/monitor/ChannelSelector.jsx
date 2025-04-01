// src/components/monitor/ChannelSelector.jsx
const ChannelSelector = ({ channels, selectedChannel, onChannelChange }) => {
    return (
      <div className="border-b border-gray-200">
        <div className="flex -mb-px overflow-x-auto">
          {channels.map((channel) => (
            <button
              key={channel.id}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium ${
                selectedChannel === channel.id
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
              }`}
              onClick={() => onChannelChange(channel.id)}
            >
              {channel.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  export default ChannelSelector;