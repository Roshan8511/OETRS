import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateBusinessEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Conference, Networking, Summit",
      required: true
    },
    {
      name: "speakerName",
      label: "Keynote Speaker",
      type: "text",
      placeholder: "e.g., Elon Musk, Ratan Tata",
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
      placeholder: "e.g., Business Center, Hotel",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 09:00 AM - 06:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 500",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 4999 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="business"
      categoryIcon="💼"
      title="Business Event"
      fields={fields}
    />
  );
}

export default CreateBusinessEvent; 