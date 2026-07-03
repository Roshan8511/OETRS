import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateMusicEvent() {
  const fields = [
    {
      name: "singerName",
      label: "Singer/Artist Name",
      type: "text",
      placeholder: "e.g., Arijit Singh, Sunidhi Chauhan",
      required: true
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      placeholder: "Select start date",
      required: true
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      placeholder: "Select end date",
      required: true
    },
    {
      name: "location",
      label: "Venue/Location",
      type: "text",
      placeholder: "e.g., Jawaharlal Nehru Stadium, Mumbai",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 07:00 PM - 11:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 5000",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹)",
      type: "number",
      placeholder: "e.g., 999",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="music"
      categoryIcon="🎵"
      title="Music Event"
      fields={fields}
    />
  );
}

export default CreateMusicEvent;