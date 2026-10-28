
from pathlib import Path
import csv

import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "dataset" / "clinical" / "hcc-data.txt"


def load_data():
    with DATA_PATH.open("r", newline="", encoding="utf-8-sig") as file:
        rows = list(csv.reader(file))

    if len(rows) != 165 or any(len(row) != 50 for row in rows):
        raise ValueError("Unexpected dataset structure. Expected 165 rows and 50 columns.")

    data = np.array(rows, dtype=object)
    data[data == "?"] = np.nan

    X = data[:, :-1]
    y = data[:, -1].astype(int)

    if set(np.unique(y)) != {0, 1}:
        raise ValueError("Expected survival labels 0 and 1.")

    print("Patients:", len(y))
    print("Features:", X.shape[1])
    print("Missing feature values:", int(np.isnan(X.astype(float)).sum()))

    return X, y


def main():
    X, y = load_data()

    # Feature types follow the order in the UCI documentation.
    # Nominal columns are one-hot encoded; numeric and ordinal
    # columns are treated as numeric for this baseline.
    nominal_columns = list(range(0, 23))
    numeric_columns = list(range(23, 49))

    X = X.astype(float)

    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    nominal_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])

    preprocess = ColumnTransformer([
        ("nominal", nominal_pipeline, nominal_columns),
        ("numeric", numeric_pipeline, numeric_columns),
    ])

    model = Pipeline([
        ("preprocess", preprocess),
        ("classifier", LogisticRegression(
            max_iter=3000,
            class_weight="balanced",
            random_state=42,
        )),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=42,
        stratify=y,
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    probabilities = model.predict_proba(X_test)[:, 1]

    print("\nEXPERIMENTAL RESULTS")
    print("Test patients:", len(y_test))
    print("Accuracy:", round(accuracy_score(y_test, predictions), 3))
    print(
        "Balanced accuracy:",
        round(balanced_accuracy_score(y_test, predictions), 3),
    )
    print("ROC-AUC:", round(roc_auc_score(y_test, probabilities), 3))
    print("\nConfusion matrix:")
    print(confusion_matrix(y_test, predictions))
    print("\nClassification report:")
    print(classification_report(
        y_test,
        predictions,
        labels=[0, 1],
        target_names=["Did not survive one year", "Survived one year"],
        zero_division=0,
    ))

    print("\nResearch/demo use only; not clinically validated.")


if __name__ == "__main__":
    main()

