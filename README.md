# HepatoCopilot – AI-Powered Liver Disease & Cancer Prediction Dashboard

A clinical decision-support platform for hepatologists. Combines 3D CT segmentation (nnU-Net v2) and lesion pathology classification (ConvNeXt-Small) with a React doctor dashboard.

## Project structure

```
backend/          FastAPI API server  (/api/classify, /api/segment, /api/health)
frontend/         React + Vite doctor dashboard
models/           nnU-Net pipeline and ConvNeXt-Small classifier
dataset/          Place CT volumes and lab