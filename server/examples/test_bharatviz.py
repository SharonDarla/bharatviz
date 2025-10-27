#!/usr/bin/env python3
"""
Test script for BharatViz client library
Run this to verify everything works before using the notebook
"""

from bharatviz import BharatViz, quick_map
import pandas as pd
import sys


def test_basic_connection():
    """Test API connection"""
    print("🔍 Testing API connection...")
    bv = BharatViz()

    try:
        data = [{"state": "Maharashtra", "value": 75.8}]
        result = bv.generate_map(data, formats=["png"], return_all=True)
        print("✅ API connection successful!")
        return True
    except Exception as e:
        print(f"❌ API connection failed: {e}")
        print("\n💡 Make sure the server is running:")
        print("   cd server && npm run dev")
        return False


def test_from_dict():
    """Test from_dict helper"""
    print("\n🔍 Testing from_dict...")
    data_dict = {"Maharashtra": 82.9, "Kerala": 93.9, "Karnataka": 75.6}
    data = BharatViz.from_dict(data_dict)

    assert len(data) == 3
    assert data[0]["state"] == "Maharashtra"
    assert data[0]["value"] == 82.9
    print("✅ from_dict works!")


def test_from_dataframe():
    """Test from_dataframe helper"""
    print("\n🔍 Testing from_dataframe...")

    # Test with auto columns
    df = pd.DataFrame({"state": ["Maharashtra", "Kerala"], "value": [82.9, 93.9]})
    data1 = BharatViz.from_dataframe(df)
    assert len(data1) == 2
    print("✅ from_dataframe (auto columns) works!")

    # Test with custom columns
    df2 = pd.DataFrame(
        {"state_name": ["Maharashtra", "Kerala"], "literacy": [82.9, 93.9]}
    )
    data2 = BharatViz.from_dataframe(df2, "state_name", "literacy")
    assert len(data2) == 2
    assert data2[0]["state"] == "Maharashtra"
    print("✅ from_dataframe (custom columns) works!")


def test_generate_map():
    """Test map generation"""
    print("\n🔍 Testing map generation...")
    bv = BharatViz()

    data = [
        {"state": "Maharashtra", "value": 75.8},
        {"state": "Karnataka", "value": 85.5},
        {"state": "Kerala", "value": 96.2},
    ]

    try:
        # Test PNG generation
        img = bv.generate_map(data, title="Test Map")
        assert img is not None
        print("✅ PNG generation works!")

        # Test save
        bv.generate_map(data, save_path="/tmp/test_map.png")
        print("✅ Save to file works!")

        # Test all formats
        result = bv.generate_map(data, formats=["png", "svg", "pdf"], return_all=True)
        assert len(result["exports"]) == 3
        print("✅ All formats generation works!")

    except Exception as e:
        print(f"❌ Map generation failed: {e}")
        return False

    return True


def test_save_all_formats():
    """Test save_all_formats"""
    print("\n🔍 Testing save_all_formats...")
    bv = BharatViz()

    data = [{"state": "Maharashtra", "value": 75.8}]

    try:
        bv.save_all_formats(data, basename="/tmp/test_all_formats")
        print("✅ save_all_formats works!")
    except Exception as e:
        print(f"❌ save_all_formats failed: {e}")
        return False

    return True


def test_dataframe_direct():
    """Test passing DataFrame directly"""
    print("\n🔍 Testing DataFrame direct pass...")
    bv = BharatViz()

    df = pd.DataFrame({"state": ["Maharashtra", "Kerala"], "value": [82.9, 93.9]})

    try:
        img = bv.generate_map(df, title="DataFrame Test")
        assert img is not None
        print("✅ Direct DataFrame pass works!")
    except Exception as e:
        print(f"❌ DataFrame direct pass failed: {e}")
        return False

    return True


def main():
    print("=" * 60)
    print("BharatViz Client Library Test Suite")
    print("=" * 60)

    # Test helper functions (don't need API)
    test_from_dict()
    test_from_dataframe()

    # Test API-dependent functions
    if not test_basic_connection():
        print("\n⚠️  API tests skipped - server not running")
        print("\nTo run full tests, start the server:")
        print("  cd server && npm run dev")
        sys.exit(1)

    test_generate_map()
    test_save_all_formats()
    test_dataframe_direct()

    print("\n" + "=" * 60)
    print("🎉 All tests passed!")
    print("=" * 60)
    print("\nYou're ready to use the Jupyter notebook!")
    print("Run: jupyter notebook bharatviz_demo.ipynb")


if __name__ == "__main__":
    main()
