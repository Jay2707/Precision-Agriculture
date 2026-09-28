import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import type { Disease } from '../types';
import { motion } from "framer-motion";
export default function ImageAnalysis() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<Disease[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [controlMethods, setControlMethods] = useState<{ natural: string[]; organic: string[] }>({
    natural: [],
    organic: [],
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setControlMethods({ natural: [], organic: [] });

    const apiKey = import.meta.env.VITE_PLANT_ID_API_KEY || 'YOUR_PLANT_ID_API_KEY';
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorResponse = await response.text();
        throw new Error(`Error analyzing image: ${errorResponse}`);
      }

      const data = await response.json();
      const firstSuggestion = data?.suggestions?.[0];

      const isValidPlant =
        firstSuggestion &&
        firstSuggestion.plant_details &&
        (firstSuggestion.plant_details.scientific_name ||
          (firstSuggestion.plant_details.common_names &&
            firstSuggestion.plant_details.common_names.length > 0));

      if (!isValidPlant) {
        throw new Error('Please provide a plant image for analysis.');
      }

      setResults(data.suggestions as Disease[]);

      const diseaseName =
        firstSuggestion?.plant_details?.common_names?.[0] ||
        firstSuggestion?.plant_details?.scientific_name ||
        'Unknown disease';

      await fetchControlMethodsFromHF(diseaseName);
    } catch (err) {
      const error = err as Error;
      setErrorMessage(`There was an error analyzing the image: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

    const fetchControlMethodsFromHF = async (plantName: string) => {
    const prompt = `For common diseases and pests of the plant "${plantName}", give exactly 5 NATURAL control methods (cultural, biological and physical practices such as crop rotation, pruning, beneficial insects, spacing) and exactly 5 ORGANIC control methods (organic-approved products such as neem oil, copper or sulfur sprays, Bacillus subtilis, compost tea). Both lists must be filled and different from each other. Reply ONLY with JSON in this exact format: {"natural": ["...", "...", "...", "...", "..."], "organic": ["...", "...", "...", "...", "..."]}`;
    try {
      const response = await fetch('http://localhost:5000/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: 'You are a plant pathology expert. Reply only with valid JSON.',
          prompt,
          maxTokens: 500,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'AI request failed');

      const jsonText = (data.text || '').match(/\{[\s\S]*\}/)?.[0] || '{}';
      const parsed = JSON.parse(jsonText);
      const pick = (word: string): string[] => {
        const key = Object.keys(parsed).find((k) => k.toLowerCase().includes(word));
        return key && Array.isArray(parsed[key]) ? parsed[key] : [];
      };
      const methods = { natural: pick('natural'), organic: pick('organic') };
      setControlMethods(methods);
      return methods;
    } catch (error) {
      console.error('Error fetching control methods:', error);
      setControlMethods({ natural: [], organic: [] });
      return null;
    }
  };

  return (
    <motion.div
      className="flex min-h-screen bg-gradient-to-tr from-green-50 via-white to-green-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="flex-1 max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
      >
        <motion.h2
          className="text-3xl font-bold text-green-700 mb-6 text-center tracking-wide"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          🌱 Crop Diseasen Detection
        </motion.h2>
  
        {/* Upload Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label className="block">
            <motion.div
              className="flex items-center justify-center w-full h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
            >
              {image ? (
                <motion.img
                  src={image}
                  alt="Uploaded crop"
                  className="h-full max-w-full object-contain rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                />
              ) : (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Upload className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-sm text-gray-600 font-medium">
                    Click to upload plant image
                  </p>
                </motion.div>
              )}
            </motion.div>
            <input
              type="file"
              className="hidden"
              onChange={handleImageUpload}
              accept="image/*"
            />
          </label>
        </motion.div>
  
        {/* Analysis Section */}
        {isAnalyzing ? (
          <motion.div
            className="flex items-center justify-center p-6 bg-gray-100 rounded-lg shadow-inner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-3 font-medium text-gray-700">Analyzing image...</span>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            className="bg-gray-50 p-6 rounded-xl shadow-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-semibold text-green-700 mb-4">🔍 Results</h3>
  
            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-800">
              {results.map((disease, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <span className="font-medium text-green-700">
                    {(disease as any)?.plant_name ?? "Unknown Disease"}
                  </span>{" "}
                  - {(((disease as any)?.probability ?? 0) * 100).toFixed(0)}% confidence
                </motion.li>
              ))}
            </ul>
  
            {/* Control Methods */}
            <div className="space-y-4">
              <h4 className="text-xl font-semibold text-green-600">🛡️ Control Methods</h4>
  
              <div>
                <h5 className="text-lg font-medium mt-2 text-green-700">🌿 Natural Methods:</h5>
                <ul className="list-disc list-inside pl-4 text-gray-700">
                  {controlMethods.natural.map((method, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {method}
                    </motion.li>
                  ))}
                </ul>
              </div>
  
              <div>
                <h5 className="text-lg font-medium mt-4 text-green-700">🍀 Organic Methods:</h5>
                <ul className="list-disc list-inside pl-4 text-gray-700">
                  {controlMethods.organic.map((method, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index + 0.2 }}
                    >
                      {method}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : (
          errorMessage && (
            <motion.div
              className="mt-4 bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              ❌ {errorMessage}
            </motion.div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
