Our solution is an AI-driven Smart Resource Allocation Platform designed to help NGOs respond faster and more efficiently to critical community needs by automating data processing, prioritization, and resource distribution.

The platform collects unstructured data from NGO reports, which may include images, PDFs, or text-based forms submitted by field workers. This data is processed using OCR (Optical Character Recognition) to extract textual content, followed by Natural Language Processing (NLP) powered by Google AI model – Gemini (google/gemini-2.0-flash-lite-001).
The AI model analyzes the extracted text to identify key parameters such as location, type of issue (food, medical, shelter), number of people affected, and severity level.

Once the data is structured, the system applies an AI-based urgency scoring mechanism, which evaluates multiple factors like severity, population affected, and critical conditions (e.g., children, lack of resources). Based on this analysis, each case is assigned a priority level (Low, Medium, High, Critical) to ensure that the most urgent needs are addressed first.

The platform then performs intelligent volunteer matching, where the system automatically assigns tasks to the most suitable volunteers by considering their skills, geographical proximity, and availability. This ensures optimal utilization of resources and minimizes response delays.

The entire system is supported by Google Firebase, which acts as the backend infrastructure:
-> Firebase Firestore stores structured report data in real-time
-> Firebase Authentication ensures secure access for NGO admins and volunteers
-> Firebase Storage manages uploaded files like images and reports

Volunteers receive real-time task notifications through the application, enabling immediate action. Meanwhile, administrators can monitor operations through a live dashboard that provides map-based visualization, analytics, task status, and impact metrics such as response time, number of families helped, and tasks completed.

Overall, this system ensures that the right resources are allocated to the right place at the right time, significantly reducing response time, improving coordination, and maximizing social impact through data-driven decision-making.
