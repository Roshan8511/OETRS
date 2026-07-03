import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateEducationEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Workshop, Seminar, Conference",
      required: true
    },
    {
      name: "speakerName",
      label: "Speaker/Instructor Name",
      type: "text",
      placeholder: "e.g., Dr. APJ Abdul Kalam",
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
      placeholder: "e.g., Convention Center, Online",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 10:00 AM - 05:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 200",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 999 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="education"
      categoryIcon="📚"
      title="Education Event"
      fields={fields}
    />
  );
}

export default CreateEducationEvent;