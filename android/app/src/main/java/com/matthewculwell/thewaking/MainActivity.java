package com.matthewculwell.thewaking;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Before the bridge lays out the WebView, so older Android matches
        // the edge-to-edge insets the HUD already reads.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
