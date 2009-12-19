<?php
/*
Plugin Name: Better File Editor
Description: Edit themes and plugins using Mozilla's Bespin code editor.
Version: 1.0.1
Author: Matt Gibbs
Author URI: http://pods.uproot.us/

Copyright 2009  Matt Gibbs  (email : logikal16@gmail.com)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/
define('BFE_URL', WP_PLUGIN_URL . '/better-file-editor');

function bfe_menu()
{
    add_options_page('Better File Editor', 'Better File Editor', 0, 'better-file-editor', 'bfe_edit_area');
}

function bfe_edit_area()
{
    $upload_dir = wp_upload_dir();
    $upload_dir = str_replace(get_option('siteurl'), '', $upload_dir['baseurl']);
    $upload_dir = str_replace('/uploads', '', $upload_dir);
?>

<link rel="stylesheet" type="text/css" href="<?php echo BFE_URL; ?>/style.css" />
<script type="text/javascript" src="<?php echo BFE_URL; ?>/js/jqFileTree.js"></script>
<script type="text/javascript" src="<?php echo BFE_URL; ?>/js/BespinEmbedded.js"></script>
<script type="text/javascript">
var editor_file;
var auth = '<?php echo md5(AUTH_KEY); ?>';

window.onBespinLoad = function() {
    bespin = document.getElementById("editor").bespin;
};

jQuery(function() {
    jQuery(".filebox").fileTree({
        root: "<?php echo $upload_dir; ?>/",
        script: "<?php echo BFE_URL; ?>/filetree.php",
        multiFolder: false
    },
    function(file) {
        editor_file = file;
        loadContent();
    });
});

function loadContent() {
    jQuery.ajax({
        type: "post",
        url: "<?php echo BFE_URL; ?>/ajax.php",
        data: "auth="+auth+"&action=load&file="+editor_file,
        success: function(msg) {
            if ("Error" == msg.substr(0, 5)) {
                alert(msg);
            }
            else {
                var code = msg;
                bespin.setContent(code);
            }
        }
    });
}

function saveContent() {
    var code = bespin.getContent();

    jQuery.ajax({
        type: "post",
        url: "<?php echo BFE_URL; ?>/ajax.php",
        data: "auth="+auth+"&action=save&file="+editor_file+"&code="+encodeURIComponent(code),
        success: function(msg) {
            if ("Error" == msg.substr(0, 5)) {
                alert(msg);
            }
            else {
                alert("Saved!");
            }
        }
    });
}
</script>

<div class="wrap">
    <div id="icon-options-general" class="icon32"><br /></div>
    <h2>Better File Editor</h2>
    <table style="width:100%" cellpadding="0" cellspacing="0">
        <tr>
            <td style="width:200px; vertical-align:top">
                <h3>Select a file or folder</h3>
                <div class="filebox" style="overflow:auto"></div>
            </td>
            <td style="vertical-align:top">
                <div id="editor" class="bespin" style="height:360px"></div>
                <input type="button" class="button" onclick="saveContent()" value="Save File" />
            </td>
        </tr>
    </table>
</div>

<?php
}

add_action('admin_menu', 'bfe_menu', 9999);
