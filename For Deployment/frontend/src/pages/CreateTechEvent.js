import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateTechEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Hackathon, Tech Talk, Workshop",
      required: true
    },
    {
      name: "speakerName",
      label: "Speaker/Host",
      type: "text",
      placeholder: "e.g., Sundar Pichai, Tech Expert",
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
      label: "Venue",
      type: "text",
      placeholder: "e.g., Tech Park, Online",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 10:00 AM - 06:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 300",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 1999 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="technology"
      categoryIcon="💻"
      title="Tech Event"
      fields={fields}
    />
  );
}

export default CreateTechEvent;